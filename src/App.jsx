import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { getReadOnlyProvider, isSupportedChain, shortenAccount } from './utils'
import { ethers } from 'ethers';

function App() {
  const [signature, setSignature] = useState();
  const [account, setAccount] = useState();
  const [isActive, setIsActive] = useState(false);
  const [provider, setProvider] = useState(
    null
  );
  const [chainId, setChainId] = useState();
  const [signLoading, setSignLoading] = useState(false);

  const schema = yup
    .object({
      email: yup.string().email().required(),
      name: yup.string().required(),
      message: yup.string().required(),
    })
    .required();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const connect = async () => {
    if (window.ethereum === undefined)
      return alert("not an ethereum-enabled browser");
    try {
      return window.ethereum.request({
        method: "eth_requestAccounts",
      });
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const handleAccountChanged = async (accounts) => {
    if (!accounts.length) {
      setAccount(undefined);
      setChainId(undefined);
      setIsActive(false);
      return setProvider(null);
    }
    const chain = await window.ethereum.request({
      method: "eth_chainId",
    });

    setAccount(accounts[0]);
    setChainId(Number(chain));
    if (isSupportedChain(chain)) {
      setIsActive(true);
      setProvider(new ethers.BrowserProvider(window.ethereum));
    } else {
      setProvider();
      setIsActive(false);
      setProvider(null);
    }
  };

  const eagerlyConnect = async () => {
    if (window.ethereum === undefined) return;
    const accounts = await window?.ethereum?.request({
      method: "eth_accounts",
    });

    if (!accounts.length) return;

    handleAccountChanged(accounts);
  };

  const handleChainChanged = (chain) => {
    setChainId(Number(chain));
    if (isSupportedChain(chain)) {
      setIsActive(true);
      setProvider(new ethers.BrowserProvider(window.ethereum));
    } else {
      setIsActive(false);
      setProvider(null);
    }
  };

  useEffect(() => {
    if (window.ethereum === undefined) return;
    eagerlyConnect();
    window.ethereum.on("chainChanged", handleChainChanged);

    window.ethereum.on("accountsChanged", handleAccountChanged);

    return () => {
      window.ethereum.removeListener(
        "accountsChanged",
        handleAccountChanged
      );

      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signContract = async (data) => {
    setSignLoading(true)
    const signer = await provider.getSigner();
    try {

      // Define the corresponding struct type in Solidity
      const myStructType = ["string", "string", "string"];
      const myStructData = [data.name, data.email, data.message];

      // Pack the struct data
      const packedData = ethers.solidityPackedKeccak256(myStructType, myStructData);
      const message = ethers.getBytes(packedData)
      let sig = await signer.signMessage(message);

      // const recoveredSigner = ethers.verifyMessage(ethers.getBytes(packedData), sig);
      // const splitSig = ethers.Signature.from(sig)
      // console.log(ethers.Signature.from(splitSig).serialized)
      setSignature(sig)
      setTimeout(() => {
        toast.success("Message signature successful");
        setSignLoading(false)
      }, 1500);

    } catch (e) {
      toast.error("Error occurred")
      setSignLoading(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="navbar bg-black px-6">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">Web3Signer</a>
        </div>
        <div className="flex-none gap-4">
          <span>{!!account && shortenAccount(account)}</span>
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full">
                <img alt="Encryptor" src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* body */}
      <div className="hero flex items-center pt-10 h-full px-6">
        <div className="hero-content flex-col lg:flex-row-reverse">
          <div className="text-center lg:text-left">
            <h1 className="text-5xl font-bold">Web3Signer</h1>
            <p className="py-6">Securely log in, sign messages, and view signed content with ease using Web3 integration and Ethereum transactions. Note that the signed message will include your name, email and the message itself.</p>
          </div>
          <div className="md:card shrink-0 w-full max-w-lg shadow-2xl bg-base-100">
            <form onSubmit={handleSubmit(signContract)} className="md:card-body">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Your Name</span>
                </label>
                <input type="text" {...register("name")} placeholder="Full Name" className="input input-bordered" required />
                <p className="text-red-500 text-xs italic pt-1">{errors.name?.message}</p>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Your Email</span>
                </label>
                <input type="email" {...register("email")} placeholder="Email" className="input input-bordered" required />
                <p className="text-red-500 text-xs italic pt-1">{errors.email?.message}</p>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Message</span>
                </label>
                <textarea {...register("message")} placeholder="Enter Message" className="textarea textarea-bordered" rows={5} required />
                <p className="text-red-500 text-xs italic pt-1">{errors.message?.message}</p>
              </div>

              {!!signature &&
                <>
                  <p className='text-xl font-bold'>Here is the Signature</p>
                  <span className='text-white whitespace-pre-line break-all flex w-fit'>{signature}</span>
                </>}

              <div className="form-control mt-6">
                {(!!isActive && (account === undefined || account === '')) ?
                  <button type='button' onClick={connect} className="btn btn-primary">Connect Wallet</button>
                  :
                  <div className='w-full'>
                    {signLoading ?
                      <div className='w-full bg-primary rounded-md py-2'>
                        <span className="loading loading-spinner loading-md"></span>
                      </div>
                      :
                      <button type='submit' className="btn btn-primary rounded-md w-full">Sign Message</button>
                    }
                  </div>
                }
              </div>

            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
