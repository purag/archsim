var Processor = require("./archsim.js");

/* User-defined ISA. Must be a function taking as input `Register` and `Memory`.
 * This is how we bind the ISA to the processor's onboard reg/memory instantiation. */
var isa = function (Register, Memory, ProgramCounter) {
  var stack = [];

  return [
    {
      cmd: "push",
      desc: "Push a value on the stack",
      syntax: [
        [
          {src1: Register}
        ],
        [
          {src1: Number}
        ]
      ],
      eval: function (src1) {
        stack.push(src1);
      }
    },
    {
      cmd: "add",
      desc: "Pop + add the two values at the top of the stack, and push the result",
      syntax: [],
      eval: function () {
        stack.push(stack.pop() + stack.pop());
      }
    },
    {
      cmd: "pop",
      desc: "Pop the number from the top of the stack into a register",
      syntax: [
        [
          {dest: Register}
        ],
      ],
      eval: function () {
        return stack.pop();
      }
    }
  ];
};

/* create a new processor with the isa defined above.
 * 32 registers in this processor with 1024-cell onboard memory.
 */
var proc = new Processor(isa, 4, 8, 1, 8);

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
proc.load("push 10\npop r[0]\npush 13\npop r[1]\npush r[0]\npush r[1]\nadd\npop r[2]").exec();
