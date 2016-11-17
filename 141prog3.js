var Processor = require("./archsim.js");

/* User-defined ISA. Must be a function taking as input `Register` and `Memory`.
 * This is how we bind the ISA to the processor's onboard reg/memory instantiation. */
var isa = require("./isa.js")(function (Memory) {
  var arr = [34, -12, 18, 61, 0, 100, 49, -51, -22, 3, 41, 88, -100, 14, 39, 10, 90, -90, -80, 75];
  for (var i = 0; i < 20; i++) {
    Memory.getCell(128 + i).setValue(arr[i]);
  }
});

/* create a new processor with the isa defined above.
 * 32 registers in this processor with 1024-cell onboard memory.
 */
var proc = new Processor(isa, 8, 8, 148, 8);

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
set     32\n\
lsh     r[0]\n\
lsh     r[0]\n\
mov     r[1], r[0]\n\
ld      r[3]\n\
inc     r[0], 0\n\
ld      r[4]\n\
sub     r[3], r[4]\n\
abs     r[3]\n\
mov     r[0], r[1]\n\
\n\
mov     r[4], r[0]\n\
ld      r[5]\n\
inc     r[0], 5\n\
br      2\n\
mov     r[0], r[0]\n\
br      12\n\
\n\
ld      r[6]\n\
sub     r[6], r[5]\n\
abs     r[6]\n\
mov     r[7], r[3]\n\
sub     r[7], r[6]\n\
br      1\n\
mov     r[3], r[6]\n\
inc     r[0], 5\n\
br      -9\n\
\n\
mov     r[0], r[4]\n\
inc     r[0], 6\n\
br      -18\n\
\n\
set     1\n\
sub     r[1], r[0]\n\
mov     r[0], r[1]\n\
st      r[3]\n\
hlt");

if (process.argv.length != 3) usage();

if (process.argv[2] == "asm") console.log(proc.assemble());
else if (process.argv[2] == "run") proc.exec();
else usage();

function usage () {
  console.log("Incorrect Usage. Exiting.\n\nUsage:\n  node 141prog3.js asm\t\toutput the machine code translation of the assembly program\n  node 141prog3.js run\t\trun the assembly program")
  process.exit(1);
}
