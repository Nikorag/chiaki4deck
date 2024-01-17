export enum RegistrationAddressType {
    ps5 = 1000100,
    ps4_lt_7 = 800,
    ps4_gt_7_lt_8 = 900,
    ps4_gt_8 = 1000
}

export type RegistrationForm = {
    inputAddress : string,
    addressType : RegistrationAddressType,
    psnOnlineId? : string,
    psnAccountId : string,
    pin : string
}