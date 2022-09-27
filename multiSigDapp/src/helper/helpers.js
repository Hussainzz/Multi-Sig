export const shortAddress = (address) => {
  return `${address.slice(0, 4)}...${address.slice(38)}`;
};

export const copyToClipboard = async (txt) => {
  if ("clipboard" in navigator) {
    return await navigator.clipboard.writeText(txt);
  } else {
    return document.execCommand("copy", true, txt);
  }
};
