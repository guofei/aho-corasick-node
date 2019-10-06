class Allocation {
  constructor(da) {
    this.da = da;
    this.position = 1;
  }

  getBase(children) {
    let base = this.position - children[0].code;
    if (base < 1) {
      base = 1;
    }
    let end = this.position;
    let next = this.position;
    let numNotAvailable = 0;
    let gotoNext = true;
    for (;;) {
      let used = false;
      for (let i = 0; i < children.length; i += 1) {
        const nextState = base + children[i].code;
        if (this.da.check[nextState]) {
          used = true;
          break;
        }
      }
      if (used) {
        if (this.da.check[end]) {
          numNotAvailable += 1;
          gotoNext = false;
        }
        if (gotoNext) {
          next += 1;
        }
        end += 1;
        base += 1;
      } else {
        break;
      }
    }
    if (numNotAvailable / (end - this.position) > 0.95) {
      this.position = end;
    } else {
      this.position = next;
    }
    return base;
  }
}

module.exports = Allocation;
