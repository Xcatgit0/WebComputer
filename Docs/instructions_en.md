# WebComputer Instruction Set

This document describes all instructions used in your virtual computer system (excluding device-related instructions).

---

## 📌 General Instruction Structure
opcode src1 src2 ...
- `src1`, `src2`: Can be a register (e.g., `r1`) or an immediate value.
- `label:` is used to create a reference point for `jmp`, `call`, etc.

---

## 🧮 Arithmetic Instructions

| Instruction | Meaning                       | Example     |
|-------------|-------------------------------|-------------|
| `add`       | Add: reg1 += reg2             | `add r1 r2` |
| `sub`       | Subtract: reg1 -= reg2        | `sub r1 r2` |
| `mul`       | Multiply: reg1 *= reg2        | `mul r1 r2` |
| `div`       | Divide: reg1 /= reg2 (floor)  | `div r1 r2` |
| `adi`       | Add immediate value           | `adi r1 5`  |
| `sdi`       | Subtract immediate value      | `sdi r1 10` |

---

## 🧠 Logical & Comparison Instructions

| Instruction | Meaning                                              | Example     |
|-------------|------------------------------------------------------|-------------|
| `not`       | NOT: reg2 = (reg1 > 0 ? 0 : 1)                       | `not r1 r2` |
| `wise`      | Invert reg1 directly: reg1 = (reg1 > 0 ? 0 : 1)      | `wise r1`   |
| `cmp`       | Compare: reg1 - reg2 → set flags                     | `cmp r1 r2` |

---

## 🗃️ Data Instructions

| Instruction | Meaning                       | Example       |
|-------------|-------------------------------|---------------|
| `ldi`       | Load immediate value to reg    | `ldi r1 123`  |
| `mov`       | Move: reg2 = reg1              | `mov r1 r2`   |

---

## 🔁 Control Flow (Jump & Call)

| Instruction | Meaning                                      | Example         |
|-------------|----------------------------------------------|-----------------|
| `jmp`       | Jump to label                                | `jmp loop`      |
| `call`      | Call function, saving current position       | `call drawUI`   |
| `end`       | End `call` and return                        | `end`           |
| `goto`      | Jump to specific PC index                    | `goto 45`       |

---

## 📐 Conditional Jumps

| Instruction | Meaning                       | Example       |
|-------------|-------------------------------|---------------|
| `je`        | Jump if zero flag (zf) == 1   | `je endloop`  |
| `jnz`       | Jump if reg2 != 0             | `jnz loop`    |
| `jez`       | Jump if reg2 == 0             | `jez exit`    |
| `jgz`       | Jump if reg2 > 0              | `jgz skip`    |

---

## 📤/📥 I/O

| Instruction | Meaning                      | Example       |
|-------------|------------------------------|---------------|
| `in`        | Read from address → reg2     | `in r1 r2`    |
| `out`       | Write reg2 to address        | `out r1 r2`   |

---

## 🖥️ Terminal (TTY)

| Instruction | Meaning                    | Example            |
|-------------|----------------------------|---------------------|
| `tty`       | Terminal command           | `tty 1 "Hello"`     |

| Mode | Meaning                                 |
|------|------------------------------------------|
| `0`  | Show ASCII character from number         |
| `1`  | Show text                                |
| `2`  | Clear screen                             |
| `3`  | Show string from char codes              |

---

## 🏷️ Preprocessor

| Instruction | Meaning                                   | Example           |
|-------------|--------------------------------------------|-------------------|
| `define`    | Define a constant value                   | `define size 128` |
| `Rdefine`   | Reload definitions and reprocess code     | `Rdefine`         |

---

## ⛔ Halt Instructions

| Instruction | Meaning                      | Example   |
|-------------|------------------------------|-----------|
| `hlt`       | Halt system and save disk    | `hlt`     |

---

## ❓ Miscellaneous

None yet.

---

## 🧾 Notes

- Variables like `r0`, `r1`, ... `r63` are 64 general-purpose registers.
- Instructions can accept values defined using `define`, e.g.:
define max 100
ldi r1 max

Use ; for comments
