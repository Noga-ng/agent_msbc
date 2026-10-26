import { motion } from "framer-motion";
import { type Dispatch, type ReactElement, type SetStateAction } from "react";
import PhotoLink from "./photoSetup";

interface ProfileVisibilityInterface {
    photo?: string;
    type: "titulaire" | "conjoint" | "enfant"|"users";
    setting: Dispatch<SetStateAction<boolean>>;
    visible: boolean;
}

export default function MyProfile({
    photo,
    type,
    setting,
    visible,
}: ProfileVisibilityInterface): ReactElement {
    const hide = (): void => {
        setting(false);
    };

    return (
        <motion.div
            onClick={hide}
            className={`${visible ? "flex" : "hidden"} w-full h-full 
                items-center-safe justify-center-safe fixed top-0 left-0 backdrop-blur-[15px] z-99`}
        >
            <div className="w-fit h-[90%] block overflow-hidden border-none rounded-3xl">
                <img
                    src={photo ? PhotoLink(type, photo) : ""}
                    alt="P"
                    className="w-full h-full object-contain rounded-2xl"
                />
            </div>
        </motion.div>
    );
}
