export const getReadOnlyProvider = (chainId) => {
  return new ethers.JsonRpcProvider(rpcUrlsMap[chainId]);
};

const supportedChains = [11155111, 84531];

export const isSupportedChain = (chainId) =>
  supportedChains.includes(Number(chainId));

export const shortenAccount = (account) =>
  `${account.substring(0, 6)}...${account.substring(38)}`;