import BinaryFormat from '..';
import { CustomFormatter } from '../types';
import createBinaryBuffer from '../util/create-binary-buffer';
import { choiceHelper, choiceStep, fromChoiceKey } from './choice';

describe('choice tests', () => {
  describe('choiceHelper', () => {
    test('returns undefined by default', () => {
      const bb = createBinaryBuffer('hello world');
      const result = choiceHelper(bb, () => 42, fromChoiceKey('foo'), {});
      expect(result).toMatchInlineSnapshot(`undefined`);
    });
    test('returns undefined when no choice is found, and no defaultChoice is passed', () => {
      const bb = createBinaryBuffer('hello world');
      bb.data = {
        foo: 42,
      };
      const fooFormatter = new BinaryFormat<{ foo: number }>()
        .uint8('foo')
        .done();
      const result = choiceHelper(
        bb,
        (_customFormatter: CustomFormatter<{ foo: number }>) =>
          'mock-helper-result',
        fromChoiceKey('foo'),
        {
          invalidChoice: fooFormatter,
        }
      );
      expect(result).toMatchInlineSnapshot(`undefined`);
    });
    test('finds correct choice when choiceValue is a string', () => {
      const bb = createBinaryBuffer('hello world');
      bb.data = {
        foo: 'mock-foo-value',
      };
      const fooFormatter = new BinaryFormat<{
        foo: number;
      }>()
        .uint8('foo')
        .done();
      const result = choiceHelper(
        bb,
        (_customFormatter: CustomFormatter<{ foo: number }>) =>
          'mock-helper-result',
        fromChoiceKey('foo'),
        {
          'mock-foo-value': fooFormatter,
        }
      );
      expect(result).toMatchInlineSnapshot(`"mock-helper-result"`);
    });
    test('finds correct choice when choiceValue is a number', () => {
      const bb = createBinaryBuffer('hello world');
      bb.data = {
        foo: 42,
      };
      const fooFormatter = new BinaryFormat<{
        foo: number;
      }>()
        .uint8('foo')
        .done();
      const result = choiceHelper(
        bb,
        (_customFormatter: CustomFormatter<{ foo: number }>) =>
          'mock-helper-result',
        fromChoiceKey('foo'),
        {
          42: fooFormatter,
        }
      );
      expect(result).toMatchInlineSnapshot(`"mock-helper-result"`);
    });
    test('uses defaultChoice when no choice is found, and defaultChoice is passed', () => {
      const bb = createBinaryBuffer('hello world');
      bb.data = {
        foo: 42,
      };
      const fooFormatter = new BinaryFormat<{
        foo: number;
      }>()
        .uint8('foo')
        .done();
      const barFormatter = new BinaryFormat<{
        bar: number;
      }>()
        .uint8('bar')
        .done();
      const result = choiceHelper(
        bb,
        (_customFormatter: CustomFormatter<{ foo: number }>) =>
          'mock-helper-result',
        fromChoiceKey('foo'),
        {
          invalidChoice: fooFormatter,
        },
        barFormatter
      );
      expect(result).toMatchInlineSnapshot(`"mock-helper-result"`);
    });
  });
  describe('choiceStep', () => {
    test('calls the correct _read and _write methods', () => {
      const mockFormatter = {
        steps: jest.fn(),
        _read: jest.fn(),
        _write: jest.fn(),
        read: jest.fn(),
        write: jest.fn(),
      };
      const mockWriteValue = jest.fn();
      const result = choiceStep(fromChoiceKey('tag'), {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        1: mockFormatter as any,
      });
      const bb = createBinaryBuffer('hello world');
      bb.data = {
        tag: 1,
      };
      expect(mockFormatter._read).toHaveBeenCalledTimes(0);
      expect(mockFormatter._write).toHaveBeenCalledTimes(0);
      result.read(bb);
      expect(mockFormatter._read).toHaveBeenCalledTimes(1);
      expect(mockFormatter._write).toHaveBeenCalledTimes(0);
      result.write(bb, mockWriteValue);
      expect(mockFormatter._read).toHaveBeenCalledTimes(1);
      expect(mockFormatter._write).toHaveBeenCalledTimes(1);
      expect(mockFormatter._write).toHaveBeenCalledWith(bb, mockWriteValue);
    });
  });
});
