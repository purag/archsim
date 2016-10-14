var Processor = require("./archsim.js");

/* User-defined ISA. Must be a function taking as input `Register` and `Memory`.
 * This is how we bind the ISA to the processor's onboard reg/memory instantiation. */
var isa = function (Register, Memory, ProgramCounter) {
  return [
    {
      cmd: "mov",
      desc: "Move a number constant into a register",
      syntax: [
        {
          src1: Number,
          dest: Register
        }
      ],
      eval: function (src1) {
        return src1;
      }
    },
    {
      cmd: "add",
      desc: "Add two numbers into a register",
      syntax: [
        {
          src1: Register,
          src2: Number,
        },
        {
          src1: Register,
          src2: Number,
          dest: Register
        },
        {
          src1: Register,
          src2: Register,
          dest: Register
        }
      ],
      eval: function (src1, src2) {
        return src1 + src2;
      }
    },
    {
      cmd: "sub",
      desc: "Subtract two numbers into a register",
      syntax: [
        {
          src1: Register,
          src2: Number,
          dest: Register
        },
        {
          src1: Register,
          src2: Register,
          dest: Register
        }
      ],
      eval: function (src1, src2) {
        return src1 - src2;
      }
    },
    {
      cmd: "st",
      desc: "Store a value from a register into memory",
      syntax: [
        {
          src1: Register,
          dest: Memory
        }
      ],
      eval: function (src1) {
        return src1;
      }
    },
    {
      cmd: "ld",
      desc: "Load a value from memory into register",
      syntax: [
        {
          src1: Memory,
          dest: Register
        }
      ],
      eval: function (src1) {
        return src1;
      }
    }
  ];
};

/* create a new processor with the isa defined above.
 * 32 registers in this processor with 1024-cell onboard memory.
 */
var proc = new Processor(isa, 12, 8, 128, 8);

/* define the oninstructioncomplete listener -- executed after pc is incremented */
proc.onProgramComplete = function (r, m) {
  for (var i = 0; i < r.getRegisterFile().length; i++) {
    console.log("r[" + i + "]: " + r.getReg(i).valueOf());
  }
  console.log("m[0]: " + m.getCell(0).valueOf());
};

/* define onerror listener -- executed when there is an error anywhere in the processor. */
proc.onError = function (e) {
  console.error(e);
}

/* load a user program into the processor and execute it */
proc.load("mov 6, r[0]\nst r[0], m[0]\nld m[0], r[3]\nadd r[3], 8\nst r[3], m[0]").exec();
