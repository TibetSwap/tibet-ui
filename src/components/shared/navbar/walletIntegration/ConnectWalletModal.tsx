import type { SessionTypes } from "@walletconnect/types";
import { Transition } from '@headlessui/react';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Image from 'next/image';
import toast from "react-hot-toast";

import PlusIcon from '../../icons/PlusIcon';
import WalletConnectIcon from '../../icons/WalletConnectIcon';
import Modal from '../../Modal';

import WalletConnectQR from './WalletConnectQR';
import WalletConnectSession from './WalletConnectSession';

import { type RootState } from '@/redux/store';
import WalletManager from "@/utils/walletIntegration/walletManager";
import WalletConnect from "@/utils/walletIntegration/wallets/walletConnect";




interface ConnectWalletModalProps {
    isOpen: boolean;
    setIsOpen: (value: boolean) => void;
    isWalletOnWrongChain: boolean;
}

function ConnectWalletModal({ isOpen, setIsOpen, isWalletOnWrongChain }: ConnectWalletModalProps) {

    const connectedWallet = useSelector((state: RootState) => state.wallet.connectedWallet);
    const walletConnectSessions = useSelector((state: RootState) => state.walletConnect.sessions);
    const walletConnectSelectedSession = useSelector((state: RootState) => state.walletConnect.selectedSession);
    
    const walletManager = new WalletManager();

    // Hydrate UI with WC sessions
    useEffect(() => {
        const walletConnect = new WalletConnect();
        walletConnect.updateSessions();
    }, [])

    const walletConnectActive = connectedWallet === "WalletConnect" && walletConnectSelectedSession;
    const gobyActive = connectedWallet === "Goby";
    const hoogiiActive = connectedWallet === "Hoogii";

    const pairingUri = useSelector((state: RootState) => state.walletConnect.pairingUri);
    const [isPairingQRModalOpen, setIsPairingQRModalOpen] = useState(false);

    const connectWCSession = async () => {
        try {
            const walletConnect = new WalletConnect();
            const newSession = await walletConnect.connectSession();
            if (newSession) {
                console.log("WC pairing successful!");
                try {
                    const address = await walletConnect.getAddress();
                    console.log({ address });
                } catch(_) {}
                setIsPairingQRModalOpen(false); // If pairing is successful
            }
          } catch (error: any) {
            if (error.message) {
              toast.error(`WalletConnect - ${error.message}`);
            }
          }
    }

    return (    
        <Modal isOpen={isOpen} setIsOpen={setIsOpen} title="Connect Wallet">
            {/* Wallet Options */}
            <div className="flex flex-col gap-4">
                
                {/* Goby Wallet */}
                <div>
                    <div onClick={() => connectedWallet === "Goby" ? walletManager.disconnect("Goby") : walletManager.connect("Goby")} className={`${gobyActive ? 'bg-green-700/20 focus:ring-green-700/20 hover:bg-red-400/50 dark:hover:bg-red-400/20' : 'bg-brandDark/10'} ${isWalletOnWrongChain && gobyActive ? 'rounded-t-xl' : 'rounded-xl'} hover:opacity-80 group flex items-center justify-between border-2 border-transparent hover:border-brandDark/10 py-4 px-4 cursor-pointer`}>
                    <div className="flex items-center gap-4">
                            <Image src="/assets/goby.webp" height={40} width={40} alt={'Goby Wallet Logo'} className="rounded-full" />
                            <p className="font-medium text-lg">Goby Wallet</p>
                        </div>
                        <button className={`
                        ${gobyActive ? 'outline-none text-green-700 group-hover:text-red-700 group-hover:dark:text-red-600' : ''}
                        font-medium rounded-lg px-2 py-1
                        ${gobyActive ? "before:content-['Connected'] group-hover:before:content-['Disconnect']" : "before:content-['Connect']"}`}
                        ></button>
                    </div>
                    {gobyActive && isWalletOnWrongChain && <p className="animate-fadeIn text-sm bg-red-700/80 font-medium text-brandLight px-2 py-1 rounded-b-xl text-center">Incorrect chain selected ({process.env.NEXT_PUBLIC_XCH === "TXCH" ? 'Mainnet' : 'Testnet'})</p>}
                </div>

                {/* Wallet Connect */}
                <div>
                    <div onClick={() => walletConnectSessions.length ? walletManager.connect("WalletConnect") : (connectWCSession(), setIsPairingQRModalOpen(true))} className={`${walletConnectActive ? `bg-green-700/20 focus:ring-green-700/20` : 'bg-brandDark/10'} ${walletConnectActive || (pairingUri && isPairingQRModalOpen) || isPairingQRModalOpen ? 'rounded-t-xl' : 'rounded-xl'} hover:opacity-80 group flex items-center justify-between border-2 border-transparent hover:border-brandDark/10 py-4 px-4 cursor-pointer`}>
                        <div className="flex items-center gap-4">
                            <WalletConnectIcon className="w-10 h-10 dark:fill-brandLight" />
                            <p className="font-medium text-lg">Wallet Connect</p>
                        </div>
                        <button className={`
                        ${walletConnectActive ? 'outline-none text-green-700' : ''}
                        font-medium rounded-lg px-2 py-1
                        ${walletConnectActive ? "before:content-['Connected']" : "before:content-['Connect']"}
                        ${isPairingQRModalOpen ? "before:content-['Pairing'] animate-pulse" : ""}
                        `}
                        ></button>
                    </div>

                    <Transition
                        show={Boolean(walletConnectActive) || Boolean(pairingUri && isPairingQRModalOpen) || Boolean(isPairingQRModalOpen)}
                        enter="transition-all duration-300"
                        enterFrom="max-h-[0] opacity-0"
                        enterTo="max-h-[1000px] opacity-100"
                        leave="transition-all duration-300"
                        leaveFrom="max-h-[1000px] opacity-100"
                        leaveTo="max-h-[0] opacity-0"
                    >
                        <div className="animate-fadeIn text-sm bg-brandDark/10 font-medium px-4 py-4 rounded-b-xl flex flex-col gap-2 border-2 border-transparent hover:border-brandDark/10">
                            <p className={`text-base transition-opacity ${isPairingQRModalOpen || (!isPairingQRModalOpen && !walletConnectSessions.length) ? 'opacity-0' : ''}`}>Sessions</p>
                            <WalletConnectQR pairingUri={pairingUri} isOpen={isPairingQRModalOpen} setIsOpen={setIsPairingQRModalOpen} />
                            {!pairingUri && !isPairingQRModalOpen && (
                                <ul className="flex flex-col gap-2">
                                {
                                    walletConnectSessions.map((session: SessionTypes.Struct) => (
                                        <WalletConnectSession key={session.topic} img={session.peer.metadata.icons[0]} name={session.peer.metadata.name} topic={session.topic} />
                                    ))
                                }

                                    <li onClick={() => (connectWCSession(), setIsPairingQRModalOpen(true))} className={`select-none rounded-xl px-8 py-4 cursor-pointer hover:opacity-80 flex justify-center items-center w-full bg-brandDark/10 h-10 animate-fadeIn`}>
                                        <PlusIcon className='w-6 h-auto' />
                                    </li>
                            
                                </ul>
                            )}
                        </div>
                    </Transition>
                </div>
            </div>
        </Modal>

     );
}

export default ConnectWalletModal;
