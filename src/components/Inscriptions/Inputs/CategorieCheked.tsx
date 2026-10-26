import { useState, type MouseEventHandler, type ReactElement } from "react";
import {motion, type Variants} from "framer-motion";
import { LuArrowLeft } from "react-icons/lu";

const fadeUp:Variants = {
   hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

export interface CategorieCheckInterface {
  handleClick:MouseEventHandler<HTMLButtonElement>;
  state:{
    steps:number,
    categorie:number
  };
  handlePerson:MouseEventHandler<HTMLButtonElement>
}

export default function CheckCategorie({handleClick,state,handlePerson}:CategorieCheckInterface):ReactElement
{

     const [backSteps,setBack] = useState<boolean>(false);

    //  const categorie = state.categorie;

    //  const exceptC = [5].includes(categorie);

      const back = () => setBack(true);

      const stps = backSteps ? 1 : state.steps;

    const s = `bg-transparent w-full p-3 text-xl font-bold flex items-center
                 justify-baseline hover:bg-gray-300 transition-all duration-4 
                 hover:text-white opacity-[.8] rounded-xl cursor-pointer`;
    return (
         <motion.div 
          initial={{
               opacity:0,
               x:-20
              }}
              animate={{
                opacity:1,
                x:0
              }}
              exit={{
                opacity:0,
                x:-20
              }}
              transition={{
                duration:.3
              }}
         className=" fixed left-0 top-0 z-2 bg-(--cream) w-full h-full flex items-center-safe justify-center-safe ">
         <div className="w-fit h-fit min-w-90 min-h-90 max-[400px]:w-80 shadow flex flex-col items-baseline p-5 
         gap-5 rounded-2xl bg-white">
            {
                stps === 1 &&

                (
                <motion.div 
                    variants={fadeUp}
                    className=" w-fit h-fit min-w-90 min-h-90 max-[400px]:w-80 flex flex-col 
                    items-baseline p-5 gap-5 rounded-2xl bg-white ">
             <span className="font-bold">
            selectionnée une categorie
           </span>
                <button className={s} 
                 value={5} type="button" onClick={(e)=>{handleClick(e); setBack(false)}}>
                   <span className="font-bold">Salam@</span>
                </button>
                <button className={s}
                value={6} type="button" onClick={(e)=>{handleClick(e); setBack(false)}}>
                    <span className="font-bold">Salam@Be</span>
                </button>
                <button className={s}
                 value={7} type="button" onClick={(e)=>{handleClick(e); setBack(false)}}>
                    <span className="font-bold"> AnkohonanaSalam@</span>
                </button>
                <button className={s}
                value={8} type="button" onClick={(e)=>{handleClick(e); setBack(false)}}>
                   <span className="font-bold"> AnkohonanaSalam@Be</span>
                </button>
            </motion.div>
                )
            }

            {
                stps === 2 &&

                (
              <motion.div 
              variants={fadeUp}
              initial={{
               opacity:0,
               x:-20
              }}
              animate={{
                opacity:1,
                x:0
              }}
              exit={{
                opacity:0,
                x:-20
              }}
              transition={{
                duration:.3
              }}
              className=" w-fit h-fit min-w-90 min-h-90 max-[400px]:w-80 flex 
              flex-col items-baseline p-5 gap-5 rounded-2xl bg-white ">

                <button className={s}
                 value={"minor"} type="button" onClick={handlePerson}>
                    <span className="font-bold"> Mineur</span>
                </button>
              
                <button className={s}
                value={"major"} type="button" onClick={handlePerson}>
                   <span className="font-bold"> Majeur</span>
                </button>
               </motion.div>
                )
            }
            
           { stps !== 1 && <button type="button" onClick={back} aria-label="Revenir aux catégories" className="cursor-pointer">
                <LuArrowLeft size={20}/>
            </button> }
         </div>
        </motion.div>
    );
}