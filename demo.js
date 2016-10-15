var Processor = require("./archsim.js");

/* User-defined ISA. Must be a function taking as input `Register` and `Memory`.
 * This is how we bind the ISA to the processor's onboard reg/memory instantiation. */
var isa = function (Register, Memory, ProgramCounter) {
  var condition = false;
  var overflow = 0;

  return [
    {
      cmd: "mov",
      desc: "Move a number constant into a register",
      syntax: [
        [
          {src1: Number},
          {dest: Register}
        ]
      ],
      eval: function (src1) {
        return src1;
      }
    },
    {
      cmd: "add",
      desc: "Add two numbers into a register",
      syntax: [
        [
          {src1: Register},
          {src2: Number}
        ],
        [
          {src1: Register},
          {src2: Number},
          {dest: Register}
        ],
        [
          {src1: Register},
          {src2: Register},
          {dest: Register}
        ],
        [
          {dest: Register},
          {src1: Number},
          {src2: Number}
        ]
      ],
      eval: function (src1, src2) {
        return src1 + src2;
      }
    },
    {
      cmd: "sub",
      desc: "Subtract two numbers into a register",
      syntax: [
        [
          {src1: Register},
          {src2: Number},
          {dest: Register}
        ],
        [
          {src1: Register},
          {src2: Register},
          {dest: Register}
        ]
      ],
      eval: function (src1, src2) {
        return src1 - src2;
      }
    },
    {
      cmd: "st",
      desc: "Store a value from a register into memory",
      syntax: [
        [
          {src1: Register},
          {dest: Memory}
        ]
      ],
      eval: function (src1) {
        return src1;
      }
    },
    {
      cmd: "ld",
      desc: "Load a value from memory into register",
      syntax: [
        [
          {src1: Memory},
          {dest: Register}
        ]
      ],
      eval: function (src1) {
        return src1;
      }
    },
    {
      cmd: "bra",
      desc: "Unconditional branch with relative instruction offset",
      syntax: [
        [
          {src1: Number}
        ]
      ],
      eval: function (src1) {
        ProgramCounter.set(ProgramCounter.get() + src1);
      }
    },
    {
      cmd: "br",
      desc: "Conditional branch with relative instruction offset",
      syntax: [
        [
          {src1: Number}
        ]
      ],
      eval: function (src1) {
        if (condition) {
          ProgramCounter.set(ProgramCounter.get() + src1);
        }
      }
    },
    {
      cmd: "slt",
      desc: "Set the condition bit if src1 < src2",
      syntax: [
        [
          {src1: Register},
          {src2: Register}
        ],
        [
          {src1: Register},
          {src2: Number}
        ]
      ],
      eval: function (src1, src2) {
        condition = src1 < src2;
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
proc.load("mov 0, r[0]\nadd r[1], 5\nadd r[0], 1\nslt r[0], 10\nbr -4\nmov 0xFF, r[3]\nst r[3], m[0]\nadd  r[6], 9, 7").exec();
