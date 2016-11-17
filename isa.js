module.exports = function (init) {
  return function (Register, Memory, ProgramCounter) {
    var condition = false;
    var overflow = 0;

    init(Memory);

    var bounds = [0, 1, 2, 8, 96, 148, 147];

    return [
      {
        cmd: "br",
        opcode: "001",
        syntax: [
          [
            {src1: Number}
          ]
        ],
        eval: function (src1) {
          if (condition)
            ProgramCounter.set(ProgramCounter.get() + src1);
          condition = false;
        }
      },
      {
        cmd: "set",
        opcode: "010",
        syntax: [
          [
            {src1: Number}
          ]
        ],
        eval: function (src1) {
          condition = false;
          Register.getReg(0).setValue(src1);
        }
      },
      {
        cmd: "hlt",
        opcode: "000000000",
        syntax: [],
        eval: function () {}
      },
      {
        cmd: "ld",
        opcode: "000001",
        syntax: [
          [
            {src1: Register}
          ]
        ],
        eval: function (src1) {
          return Memory.getCell(Register.getReg(0).valueOf()).valueOf();
        }
      },
      {
        cmd: "st",
        opcode: "000010",
        syntax: [
          [
            {src1: Register}
          ]
        ],
        eval: function (src1) {
          Memory.getCell(Register.getReg(0).valueOf()).setValue(src1);
        }
      },
      {
        cmd: "abs",
        opcode: "000011",
        syntax: [
          [
            {src1: Register}
          ]
        ],
        eval: function (src1) {
          overflow = 0;
          return Math.abs(src1);
        }
      },
      {
        cmd: "lsh",
        opcode: "000100",
        syntax: [
          [
            {src1: Register}
          ]
        ],
        eval: function (src1) {
          var shift = (src1 << 1) | overflow;
          overflow = (src1 & 0x80) >> 7;
          return shift;
        }
      },
      {
        cmd: "rsh",
        opcode: "000101",
        syntax: [
          [
            {src1: Register}
          ]
        ],
        eval: function (src1) {
          overflow = 0;
          return src1 >> 1;
        }
      },
      {
        cmd: "andc",
        opcode: "000110",
        syntax: [
          [
            {src1: Register}
          ]
        ],
        eval: function (src1) {
          condition = !(src1 & 1);
          overflow = 0;
        }
      },
      {
        cmd: "add",
        opcode: "011",
        syntax: [
          [
            {src1: Register},
            {src2: Register}
          ]
        ],
        eval: function (src1, src2) {
          var sum = src1 + src2 + overflow;
          overflow = (sum & 0x100) >> 8;
          return sum;
        }
      },
      {
        cmd: "sub",
        opcode: "100",
        syntax: [
          [
            {src1: Register},
            {src2: Register}
          ]
        ],
        eval: function (src1, src2) {
          condition = src1 < src2;
          overflow = 0;
          return src1 - src2;
        }
      },
      {
        cmd: "and",
        opcode: "101",
        syntax: [
          [
            {src1: Register},
            {src2: Register}
          ]
        ],
        eval: function (src1, src2) {
          condition =
            (src1 & src2) != src2 &&
            (src1 & (src2 << 1)) != (src2 << 1) &&
            (src1 & (src2 << 2)) != (src2 << 2) &&
            (src1 & (src2 << 3)) != (src2 << 3) &&
            (src1 & (src2 << 4)) != (src2 << 3);
          overflow = 0;
          return src1 & src2;
        }
      },
      {
        cmd: "mov",
        opcode: "110",
        syntax: [
          [
            {src1: Register},
            {src2: Register}
          ]
        ],
        eval: function (src1, src2) {
          overflow = 0;
          condition = src1 == src2;
          return src2;
        }
      },
      {
        cmd: "inc",
        opcode: "111",
        syntax: [
          [
            {src1: Register},
            {src2: Number}
          ],
          [
            {src1: Register}
          ]
        ],
        eval: function (src1, src2) {
          overflow = 0;
          if (!src2) src2 = 0;
          condition = (src1 + 1) < bounds[src2];
          return src1 + 1;
        }
      },
    ];
  };
};
