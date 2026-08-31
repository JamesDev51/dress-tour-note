import { describe,expect,it } from 'vitest';
import { isNecklineCompatible, normalizeUpper } from './options';
describe('upper compatibility',()=>{
  it('one shoulder forces asymmetric',()=>{expect(normalizeUpper('oneShoulder','sweetheart')).toEqual({neckline:'asymmetric',changed:true})});
  it('strapless allows sweetheart',()=>{expect(isNecklineCompatible('strapless','sweetheart')).toBe(true)});
  it('unknown never blocks unknown',()=>{expect(isNecklineCompatible('unknown','unknown')).toBe(true)});
});
