var Processor = require("./archsim.js");

/* User-defined ISA. Must be a function taking as input `Register` and `Memory`.
 * This is how we bind the ISA to the processor's onboard reg/memory instantiation. */
var isa = require("./isa.js")(function (Memory) {
  Memory.getCell(6).setValue(0x3);
  for (var i = 32; i < 42; i++) {
    Memory.getCell(i).setValue(0x19);
  }
  for (; i < 62; i++) {
    Memory.getCell(i).setValue(0xBD);
  }
  for (; i < 71; i++) {
    Memory.getCell(i).setValue(0xE7);
  }
  for (; i < 96; i++) {
    Memory.getCell(i).setValue(0);
  }
});

/* create a new processor with the isa defined above.
 * 32 registers in this processor with 1024-cell onboard memory.
 */
var proc = new Processor(isa, 8, 8, 96, 8);

var dynamicInstr = 0;
proc.onInstructionComplete = function () {
  dynamicInstr++;
}

/* define the oninstructioncomplete listener -- executed after pc is incremented */
proc.onProgramComplete = function (r, m) {
  for (var i = 0; i < r.getRegisterFile().length; i++) {
    console.log("r[" + i + "]: " + r.getReg(i).valueOf().toString(2));
  }
  for (var j = 0; j < m.getMemoryUnit().length; j++) {
    console.log("m[" + j + "]: " + m.getCell(j).valueOf().toString(2));
  }
  console.log("dynamic instr count: " + dynamicInstr);
  console.log("\n");
};

/* define onerror listener -- executed when there is an error anywhere in the processor. */
proc.onError = function (e) {
  console.error(e);
}

proc.load("\
set     6\n\
ld      r[2]\n\
set     32\n\
ld      r[4]\n\
and     r[4], r[2]\n\
br      1\n\
inc     r[3], 0\n\
inc     r[0], 4\n\
br      -6\n\
set     7\n\
st      r[3]\n\
hlt");

if (process.argv.length != 3) usage();

if (process.argv[2] == "asm") console.log(proc.assemble());
else if (process.argv[2] == "run") proc.exec();
else usage();

function usage () {
  console.log("Incorrect Usage. Exiting.\n\nUsage:\n  node 141prog2.js asm\t\toutput the machine code translation of the assembly program\n  node 141prog2.js run\t\trun the assembly program")
  process.exit(1);
}
