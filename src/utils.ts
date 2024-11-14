export const computeAddress = (address: string) => {
    if(address.startsWith("0x") || address.endsWith(".eth")) {
        return address;
    }
    return address + ".eth";
}