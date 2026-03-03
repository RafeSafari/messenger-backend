const HEX = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

const _get_value = (c: string): number => {
  return HEX.indexOf(c);
}

const _hex_add = (c1: string, c2: string): string => {
  return HEX[(_get_value(c1) + _get_value(c2)) % 16] || '';
}

const sumUUIDs = (uid1: string, uid2: string): string => {
  if (uid1.length !== uid2.length) {
    throw new Error('Different length of strings');
  } else {
    return uid1.split('').map((c1, i) => c1 === '-' ? '-' : _hex_add(c1, uid2[i] || '0')).join('');
  }
}

export default sumUUIDs;