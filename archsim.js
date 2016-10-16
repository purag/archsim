var extend = require("util")._extend;

/* Effectively a single-cycle processor.
 * Takes as input an instruction set architecture as described below,
 *   the number of registers to instantiate this processor with,
 *   and the size in cells of the onboard memory unit.
 */
function Processor (isa, regCount, regSize, memCellCount, memCellSize) {
  /* Create the register file and memory units */
  var r = new RegisterFile(regCount, regSize);
  var m = new Memory(memCellCount, memCellSize);
  
  /* Instantiate the program counter */
  var pc = new (function () {
    var value = 0;

    this.inc = function () {
      return ++value;
    };

    this.get = function () {
      return value;
    };

    this.set = function (v) {
      value = v;
    };

    this.reset = function () {
      value = 0;
    };
  })();

  /* Instantiate the ISA with the register/memory types */
  isa = isa(r, m, pc);
  
  /* Extract all the possible commands from the ISA */
  var cmds = isa.map(function (instr) { return instr.cmd });
  
  /* These maintain the state of the currently executing program */
  var loaded = false;
  var instrs;
  
  /* Default listeners do nothing when called */
  this.onProgramLoaded = function (instrs, regs, mem) {};
  this.onProgramComplete = function (regs, mem) {};
  this.onInstructionComplete = function (instr, regs, mem) {};
  this.onDecodeComplete = function (instr) {};
  this.onError = function (err) {};
  
  /* Load a program into memory */
  this.load = function (str) {
    instrs = str.split("\n");
    /* Filter out lines containing just whitespace */
    instrs = instrs.filter(function (s) { return !(/^\s*$/.test(s)) });
    set();
    this.onProgramLoaded(instrs, r, m);
    return this;
  };
  
  /* Set up the processor. This can only happen internally */
  function set () {
    loaded = true;
    pc.reset();
  }
  
  /* Reset the processor. This can only happen internally */
  function reset () {
    loaded = false;
    instrs = [];
    pc.reset();
  }
  
  /* Execute the code loaded into memory */
  this.exec = function () {
    /* If no code is loaded, abort */
    if (!loaded)
      return this.err(new ProgramNotLoadedError());
    
    /* Attempt to run the code, one instruction at a time,
     * catching and reporting any errors */
    try {
      while (pc.get() < instrs.length)
        execInstr();
    } catch (e) {
      this.onError(e.name + " " + e.message);
      return this.err(e);
    }
    
    reset();
    
    this.onProgramComplete(r, m);
    return 0;
  };
  
  /* Execute a single instruction. This call can only happen internally
   * Var-bound so we can bind the `this` parameter */
  var execInstr = function () {
    /* Decode the instruction */
    var instr = decode(instrs[pc.get()]);
    if (!instr.dest) instr.dest = instr.src1;
    /* Execute the decoded instruction */
    var result = instr.eval(
      typeof instr.src1 == "number" || instr.src1 ? instr.src1.valueOf() : undefined,
      typeof instr.src2 == "number" || instr.src2 ? instr.src2.valueOf() : undefined
    );
    if (typeof result == "number") instr.dest.setValue(result);
    pc.inc();
    this.onInstructionComplete(instr, r, m);
  }.bind(this);
  
  /* Decodes the instruction passed in. This can only happen internally
   * Var-bound to bind the `this` parameter */
  var decode = function (str) {
    /* Extract the actual instruction */
    var cmd = str.match(/^([a-z]+)\s*/);
    if (cmd == null)
      throw new IllegalInstructionError();
      
    /* Then remove it from the picture */
    str = str.replace(/^([a-z]+)\s*/, "");
      
    /* Copy the ISA entry for this instruction */
    cmd = cmd[1];
    var i = cmds.indexOf(cmd);
    if (i < 0)
      throw new InstructionNotSupportedError(cmd);
    var instr = extend({}, isa[i]);
    
    /* And split the remaining instruction up into distinct operands */
    var opStr = str.split(",");

    var valid = 1;
    if (instr.syntax.length) {
      /* Attempt to decode the instruction using one of the specified syntaxes
       * in the ISA */
      valid = 0;
      for (var j = 0; j < instr.syntax.length; j++) {
        var keys = instr.syntax[j].map(function (op) { return Object.keys(op)[0]; });
        if (keys.length !== opStr.length)
          continue;
        
        var err = 0;
        for (var k = 0; k < keys.length; k++) {
          var fetchOperand = instr.syntax[j][k][keys[k]];
          if (fetchOperand.getByDescriptor)
            fetchOperand = fetchOperand.getByDescriptor;
          try {
            var operand = fetchOperand(opStr[k]);
          } catch (e) {
            err = 1;
            break;
          }
          /* If one operand failed under this syntax, the whole rule fails */
          if (
            (typeof operand  == "number" && isNaN(operand)) ||
            operand == null || operand == undefined
          ) {
            err = 1;
            break;
          }
          instr[keys[k]] = operand;
        }
        if (err) continue;
        
        valid = 1;
        break;
      }
    }
    
    /* If we couldn't decode it, the user hasn't given a valid instruction */
    if (!valid)
      throw new IllegalInstructionError();
      
    delete instr.syntax;
    
    this.onDecodeComplete(instr);
    return instr;
  
    /* A custom error for an instruction that couldn't be decoded/executed */
    function IllegalInstructionError () {
      this.name = "Illegal Instruction:";
      this.message = instrs[pc.get()];
    }
  
    /* A custom error for an instruction that looked valid, but wasn't supported
     * by the ISA */
    function InstructionNotSupportedError (cmd) {
      this.name = "Instruction Not Supported:";
      this.message = cmd;
    }
  }.bind(this);
  
  this.err = function (e) {
    console.error(e.name, e.message);
    reset();
    return 1;
  };
  
  function ProgramNotLoadedError () {
    this.name = "Program Not Loaded:"
    this.message = "Nothing to execute."
  }
  
  /* A simple register file implementation.
   * 
   */
  function RegisterFile (regCount, regSize) {
    var r = [];
    for (var i = 0; i < regCount; i++)
      r.push(new Register());

    /* Access a particular register in the file by its descriptor, i.e. r[n] */
    this.getByDescriptor = function (str) {
      var m;
      /* Test to see if the input is of the right form */
      if (!/^\s*(r\[[0-9]+\])\s*$/.test(str) || (m = str.match(/([0-9]+)/)) == null)
        throw new RegisterFileError("Invalid register descriptor: " + str);
      /* If so, check that the inputted register number is within the bounds */
      if (+m[1] < 0 || +m[1] >= regCount)
        throw new RegisterFileError("Accessing a nonexistent register: r[" + +m[1] + "]");
      return r[+m[1]];
    };

    /* Access a particular register by its index */
    this.getReg = function (i) {
      if (i < 0 || i >= regCount)
        throw new RegisterFileError("Accessing a nonexistent register: r[" + i + "]");
      return r[i];
    };

    /* Retrieve the entire register file */
    this.getRegisterFile = function () {
      return r;
    };

    /* A custom error for reporting issues in the register file */
    function RegisterFileError (err) {
      this.name = "Register File Error:"
      this.message = err;
    }

    /* A VERY simplistic register implementation.
     * Can write/read just about anything.
     */
    function Register () {
      var value = 0;

      this.setValue = function (v) {
        value = v & (Math.pow(2, regSize) - 1);
      };

      this.valueOf = function () {
        return value;
      };
    };
  };

  /* An onboard memory implementation.
   * Each memory cell can store just about anything.
   * TODO: Make this more similar to RegisterFile, i.e. Memory is an array of MemoryCells,
   *       MemoryCells have setValue and valueOf() functions. Will work better with the
   *       processor.
   */
  function Memory (cellCount, cellSize) {
    var mem = [];
    for (var i = 0; i < cellCount; i++)
      mem[i] = new MemoryCell();

    /* Write a value to a particular memory cell */
    this.getCell = function (i) {
      if (i < 0 || i >= cellCount)
        throw new MemoryError("Accessing a nonexistent memory cell: m[" + i + "]");
      return mem[i];
    };

    /* Access a particular memory cell by its descriptor, i.e. m[n] */
    this.getByDescriptor = function (str) {
      var m;
      /* Test to see if the input is of the right form */
      if (!/^\s*(m\[[0-9]+\])\s*$/.test(str) || (m = str.match(/([0-9]+)/)) == null)
        throw new MemoryError("Invalid memory cell descriptor: " + str);
      /* If so, check that the inputted register number is within the bounds */
      if (+m[1] < 0 || +m[1] >= cellCount)
        throw new MemoryError("Accessing a nonexistent memory cell: m[" + +m[1] + "]");
      return mem[+m[1]];
    };

    this.getMemoryUnit = function () {
      return mem;
    };

    /* Custom error for reporting issues in the memory module */
    function MemoryError (err) {
      this.name = "Memory Error:";
      this.message = err;
    }

    function MemoryCell () {
      var value = 0;

      this.setValue = function (v) {
        value = v & (Math.pow(2, cellSize) - 1);
      };

      this.valueOf = function () {
        return value;
      };
    }
  };
};

module.exports = Processor;
