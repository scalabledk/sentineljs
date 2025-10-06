/**
 * Polyfills for ES5 compatibility
 * These are only included in the legacy build
 */

// String.prototype.startsWith
if (!String.prototype.startsWith) {
  String.prototype.startsWith = function (search: string, pos?: number): boolean {
    return this.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
  };
}

// String.prototype.includes
if (!String.prototype.includes) {
  String.prototype.includes = function (search: string, start?: number): boolean {
    if (typeof start !== 'number') {
      start = 0;
    }
    if (start + search.length > this.length) {
      return false;
    } else {
      return this.indexOf(search, start) !== -1;
    }
  };
}

// Object.assign
if (typeof Object.assign !== 'function') {
  Object.assign = function (target: any, ...sources: any[]): any {
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    const to = Object(target);
    for (let index = 0; index < sources.length; index++) {
      const nextSource = sources[index];
      if (nextSource != null) {
        for (const nextKey in nextSource) {
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    return to;
  };
}

// Object.entries
if (!Object.entries) {
  Object.entries = function (obj: any): [string, any][] {
    const ownProps = Object.keys(obj);
    let i = ownProps.length;
    const resArray = new Array(i);
    while (i--) {
      resArray[i] = [ownProps[i], obj[ownProps[i]]];
    }
    return resArray;
  };
}
