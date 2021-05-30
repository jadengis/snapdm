import { Adapter, setAdapter } from './adapter';

export interface SnapdmOptions {
  readonly adapter: Adapter;
}

export function initialize(options: SnapdmOptions): void {
  setAdapter(options.adapter);
}
