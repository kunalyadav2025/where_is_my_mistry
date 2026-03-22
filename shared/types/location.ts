export interface State {
  stateId: string;
  name: string;
  nameHindi: string;
  code: string;
  districtCount: number;
}

export interface District {
  districtId: string;
  stateId: string;
  name: string;
  nameHindi: string;
  tehsilCount: number;
}

export interface Tehsil {
  tehsilId: string;
  districtId: string;
  stateId: string;
  name: string;
  nameHindi: string;
  townCount: number;
}

export interface Town {
  townId: string;
  tehsilId: string;
  districtId: string;
  stateId: string;
  name: string;
  nameHindi: string;
  pincode?: string;
  workerCount: number;
}

export interface LocationHierarchy {
  state: State;
  district: District;
  tehsil: Tehsil;
  town: Town;
}

export interface LocationSearchResult {
  type: 'state' | 'district' | 'tehsil' | 'town';
  id: string;
  name: string;
  nameHindi: string;
  fullPath: string;
}
