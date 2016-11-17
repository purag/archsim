var Processor = require("./archsim.js");

/* User-defined ISA. Must be a function taking as input `Register` and `Memory`.
 * This is how we bind the ISA to the processor's onboard reg/memory instantiation. */
var isa = require("./isa.js")(function (Memory) {
  Memory.getCell(1).setValue(53);
  Memory.getCell(2).setValue(17);
  Memory.getCell(3).setValue(42);
});

/* create a new processor with the isa defined above.
 * 32 registers in this processor with 1024-cell onboard memory.
 */
var proc = new Processor(isa, 8, 8, 6, 8);

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

/* load a user program into the processor and execute it */
proc.load("\
set     1\n\
ld      r[7]\n\
inc     r[0], 0\n\
ld      r[2]\n\
inc     r[0], 0\n\
ld      r[3]\n\
sub     r[0], r[0]\n\
sub     r[1], r[1]\n\
mov     r[4], r[1]\n\
mov     r[5], r[1]\n\
andc    r[2]\n\
br      2\n\
add     r[5], r[7]\n\
add     r[4], r[6]\n\
rsh     r[2]\n\
lsh     r[7]\n\
lsh     r[6]\n\
inc     r[1], 3\n\
br      -9\n\
mov     r[6], r[4]\n\
mov     r[7], r[5]\n\
mov     r[2], r[3]\n\
inc     r[0], 2\n\
br      -17\n\
set     4\n\
st      r[4]\n\
set     5\n\
st      r[5]\n\
hlt");

console.log(proc.assemble());
proc.exec();

