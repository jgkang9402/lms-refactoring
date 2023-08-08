"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import React, { useEffect, useState } from "react";
import DatePicker from "./DatePicker";
import FilUploader from "./FileUploader";
import useCreateFeedback from "@/hooks/reactQuery/feedback/useCreateFeedback";
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/utils/firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useParams } from "next/navigation";
import useGetDetailAssignment from "@/hooks/reactQuery/assignment/useGetDetailAssignment";
import { useRouter } from "next/navigation";

export interface FormValue {
  title: string;
  content: string;
  level: "상" | "중" | "하";
  images: string[];
  startDate: Timestamp;
  endDate: Timestamp;
  createAt: Timestamp;
  updateAt: Timestamp;
  order: number;
}

interface Data {
  title: string;
  level: "상" | "중" | "하" | undefined;
  content: string;
  isModal: boolean; //얘가 첫번째 모달에서 date picker 여는 변수
  todayDate: string;
  ids: string; //왼쪽 오른쪽 date picker
  startAt: string;
  endAt: string;
  createAt: Timestamp | null;
  order: number;
}

interface ModalProps {
  // handleModal: () => void;
  // setModal: (prev: React.Dispatch<React.SetStateAction<boolean>>) => void
  isCreateModal?: boolean;
  onCloseModal: () => void;
}

const Modal: React.FC<ModalProps> = ({ onCloseModal, isCreateModal }) => {
  //원래 2번인데
  const { assignmentId } = useParams();
  const router = useRouter();
  //exist 이놈떄문에 2번 더 늘어남....
  const exist = useGetDetailAssignment(assignmentId as string);

  const en = new Date((exist.data?.endDate.seconds as number) * 1000);
  const [endYear, endMonth, endDay] = [
    en.getFullYear().toString(),
    (en.getMonth() + 1).toString(),
    en.getDate().toString(),
  ];
  // const en = new Date((exist.data?.endDate.seconds as number) * 1000);
  // const [endYear, endMonth, endDay] = [
  //   en.getFullYear().toString(),
  //   en.getMonth().toString().length === 1 && en.getMonth().toString() !== "9"
  //     ? "0" + (en.getMonth() + 1).toString()
  //     : (en.getMonth() + 1).toString(),
  //   en.getDate().toString().length === 1
  //     ? "0" + en.getDate().toString()
  //     : en.getDate().toString(),
  // ];

  // const endd = endYear + '-' + endMonth + '-' + endDay
  // console.log(Timestamp.fromMillis(Date.parse(endd)))
  // const eq = Timestamp.fromMillis(Date.parse(endd))
  const st = new Date((exist.data?.startDate.seconds as number) * 1000);
  const [startYear, startMonth, startDay] = [
    st.getFullYear().toString(),
    (st.getMonth() + 1).toString(),
    st.getDate().toString(),
  ];

  // const [startYear, startMonth, startDay] = [
  //   st.getFullYear().toString(),
  //   st.getMonth().toString().length === 1 && st.getMonth().toString() !== "9"
  //     ? "0" + (st.getMonth() + 1).toString()
  //     : (st.getMonth() + 1).toString(),
  //   st.getDate().toString().length === 1
  //     ? "0" + st.getDate().toString()
  //     : st.getDate().toString(),
  // ];

  // const [count,setCount] = useCount()
  const date = new Date();
  const years = +date.toLocaleDateString().slice(0, 4);
  const months = +date.toLocaleDateString().slice(5, 7);
  const nowDay = +date.toLocaleDateString().slice(9, 11);
  // console.log(count)
  const {
    register,
    handleSubmit,
    watch,
    getValues,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<FormValue>({
    mode: "onSubmit",
    defaultValues: {
      title: isCreateModal ? "" : exist.data?.title || "",
      level: isCreateModal ? undefined : exist.data?.level || undefined,
      images: isCreateModal ? [""] : exist.data?.images || [""],
      content: isCreateModal ? "" : exist.data?.content || "",
      startDate: undefined,
      endDate: undefined,
      createAt: isCreateModal ? undefined : exist.data?.createdAt || undefined,
      updateAt: isCreateModal ? undefined : exist.data?.updatedAt || undefined,
      order: exist.data?.order || undefined,
    },
  });

  const [dataes, setDataes] = useState<Data>({
    title: "",
    level: isCreateModal ? undefined : exist.data?.level || undefined,
    content: "",
    isModal: false, //얘가 첫번째 모달에서 date picker 여는 변수
    todayDate: "",
    ids: "", //왼쪽 오른쪽 date picker
    // startAt: `${startYear} ${startMonth} ${startDay}` || `${years} ${months} ${nowDay}`,
    startAt: isCreateModal
      ? `${years} ${months} ${nowDay}`
      : `${startYear} ${startMonth} ${startDay}` === "NaN NaN NaN"
      ? `${years} ${months} ${nowDay}`
      : `${startYear} ${startMonth} ${startDay}`,
    createAt: null,
    // endAt: `${endYear} ${endMonth} ${endDay}` || "",
    endAt: isCreateModal
      ? ""
      : `${endYear} ${endMonth} ${endDay}` === "NaN NaN NaN"
      ? ""
      : `${endYear} ${endMonth} ${endDay}`,
    order: 0,
  });
  // console.log(dataes.startAt)
  // console.log(dataes.startAt.slice(7))
  const [difficultyModal, setDifficultyModal] = useState<boolean>(false);

  const handleDifficult: React.MouseEventHandler<HTMLLIElement> = e => {
    e.stopPropagation();
    setDifficultyModal(prev => !prev);
    setDataes(prev => {
      return {
        ...prev,
        level: (e.target as HTMLDivElement).id as "상" | "중" | "하",
      };
    });
    setValue("level", (e.target as HTMLDivElement).id as "상" | "중" | "하");
  };

  const difficultModalDropMenu: React.MouseEventHandler<HTMLDivElement> = e => {
    e.stopPropagation(); // 이벤트 캡쳐링 방지
    setDifficultyModal(prev => !prev);
  };

  const handleInput: React.ChangeEventHandler<HTMLInputElement> = e => {
    //굳이 setData함수를 통해서 값을 저장해야되나? 그러면 렌더링이 너무 많이 발생함
    setDataes(prev => {
      return { ...prev, [e.target.name]: e.target.value };
    });
  };

  const handleTextArea: React.ChangeEventHandler<HTMLTextAreaElement> = e => {
    //굳이 setData함수를 통해서 값을 저장해야되나? 그러면 렌더링이 너무 많이 발생함
    setDataes(prev => {
      return { ...prev, content: e.target.value };
    });
  };

  const handleDisplayCalenderender: React.MouseEventHandler<
    HTMLDivElement
  > = e => {
    e.stopPropagation();
    let id = e.currentTarget.id;
    setDataes(prev => {
      return { ...prev, isModal: !prev.isModal, ids: id };
    });
  };

  const handleClose: React.MouseEventHandler<HTMLDivElement> = e => {
    e.stopPropagation();
    setDifficultyModal(false);
    setDataes(prev => {
      return { ...prev, isModal: false };
    });
  };
  const { mutate } = useCreateFeedback();

  const level = register("level", { required: true });
  const endD = register("endDate", { required: true });
  // console.log(getValues('endDate'))
  // console.log()
  const onSubmit: SubmitHandler<FormValue> = async data => {
    const assignmentsQuery = query(
      collection(db, "assignments"),
      orderBy("order", "desc"),
    );
    const querySnapshot = await getDocs(assignmentsQuery);
    const assignmentCount = querySnapshot.size;

    // if (assignmentId) {
    //   const assignment = doc(db, "assignments", assignmentId as string);
    //   const updateTimestamp = await updateDoc(assignment, {
    //     title: data.title,
    //     level: data.level,
    //     content: data.content,
    //     images: data.images,
    //     updateAt: serverTimestamp(),
    //     startDate: data.startDate,
    //     endDate: data.endDate,
    //     order: assignmentCount + 1,
    //   });
    //   router.refresh();
    //   console.log(1);
    // } else {
    //   const docRef = await addDoc(collection(db, "assignments"), {
    //     title: data.title,
    //     level: data.level,
    //     content: data.content,
    //     images: data.images,
    //     createAt: data.createAt,
    //     updateAt: data.updateAt,
    //     startDate: data.startDate,
    //     endDate: data.endDate,
    //     order: assignmentCount + 1,
    //   });
    //   await onCloseModal();
    // }

    // onAuthStateChanged(auth, (user) => {
    //   if (user) {
    //     // User is signed in, see docs for a list of available properties
    //     // https://firebase.google.com/docs/reference/js/auth.user
    //     const uid = user.uid;
    //     console.log(uid)
    //     // ...
    //   } else {
    //     // User is signed out
    //     // ...
    //   }
    // });

    // if (docSnap.exists()) {
    //     console.log(docSnap.data().role);
    //   } else {
    //       console.log("No such document!");
    //     }
    // console.log(data)

    // const docSnap = await getDoc(docRef);
    // if (data === undefined) return;

    // try {
    //   await mutate({
    //     docId: "KXwzRd0oTq6rZBAobLxz",
    //     assignments: {
    //       id: ,
    //       title: data.title,
    //       content: data.content,
    //       level: data.level,
    //       images: ,
    //       createdAt: ,
    //       updatedAt: ,
    //       startDate: ,
    //       endDate: ,
    //       readStudents: ,
    //     },
    //   });
  };
  // console.log(data)
  // e.preventDefault()
  // handleSubmit((data) => console.log("data",data))
  return (
    <div
      onClick={e => {
        if (difficultyModal) {
          //modal은 이 form을 말하는 거임
          setDifficultyModal(false);
        } else if (!difficultyModal && !dataes.isModal) {
        }
      }}
    >
      <div onClick={handleClose}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-[5px] flex items-center gap-x-[18px]">
            <h3 className="text-grayscale-100 text-[16px] leading-[19.09px] font-[500]">
              과제 난이도
            </h3>
            <div className="w-[245px] relative">
              <div
                className="h-[40px] flex items-center cursor-pointer justify-between px-[15px] py-[10px] bg-white rounded-[10px] border mb-[5px]"
                onClick={difficultModalDropMenu}
              >
                <span className="text-grayscale-40">
                  {dataes.level != undefined
                    ? dataes.level
                    : "난이도를 선택해주세요"}
                </span>
                <img
                  src="/images/topdownArrow.svg"
                  alt=""
                  className="select-none"
                />
              </div>

              {difficultyModal && (
                <ul
                  className="cursor-pointer flex flex-col gap-y-[11px] absolute w-[245px] bg-white p-[10px] border rounded-[10px] z-10"
                  onClick={value => setValue("level", value)}
                >
                  <li
                    id="초"
                    className="cursor-pointer h-[45px] py-[13px] pl-[20px]"
                    onClick={handleDifficult}
                    // {...register("level", {
                    //   required: "난이도를 입력해주세요.",
                    //   onChange: e => {
                    //     console.log(e.target.id)
                    //     setDataes(prev => {
                    //       return { ...prev, level: (e.target as HTMLDivElement).id as "상" | "중" | "하" };
                    //     });
                    //   }
                    // })}
                  >
                    <span className="pointer-events-none option-text text-grayscale-80">
                      초
                    </span>
                  </li>

                  <li
                    id="중"
                    className="h-[45px] py-[13px] pl-[20px] cursor-pointer"
                    onClick={handleDifficult}

                    // {...register("level", {
                    //   required: "난이도를 입력해주세요.",
                    //   onChange: e => {
                    //     console.log(e.target.id)
                    //     setDataes(prev => {
                    //       return { ...prev, level: (e.target as HTMLDivElement).id as "상" | "중" | "하" };
                    //     });
                    //   }
                    // })}
                  >
                    <span className="pointer-events-none option-text text-grayscale-80">
                      중
                    </span>
                  </li>

                  <li
                    id="고"
                    className="h-[45px] py-[13px] pl-[20px] cursor-pointer"
                    onClick={handleDifficult}

                    // {...register("level", {
                    //   required: "난이도를 입력해주세요.",
                    //   onChange: e => {
                    //     console.log(e.target.id)
                    //     setDataes(prev => {
                    //       return { ...prev, level: (e.target as HTMLDivElement).id as "상" | "중" | "하" };
                    //     });
                    //   }
                    // })}
                  >
                    <span className="pointer-events-none option-text text-grayscale-80">
                      고
                    </span>
                  </li>
                </ul>
              )}
            </div>
          </div>
          {/* name="title" */}
          <input
            id="title"
            type="text"
            placeholder="제목을 입력해주세요.(선택)"
            className="h-[24px] mb-[13px] placeholder:text-grayscale-40 outline-none text-[20px] leading-[23.87px] font-[500]"
            {...register("title", {
              required: "제목을 입력해주세요.",
              onChange: e => {
                setDataes(prev => {
                  return { ...prev, title: e.target.value };
                });
              },
            })}
          />
          {/* onChange={handleInput} */}
          <div className="relative">
            <textarea
              wrap="hard"
              id=""
              cols={30}
              rows={10}
              className="w-[707px] h-[298px] py-[22px] px-[20px] rounded-[10px] border mb-[20px] resize-none"
              placeholder="내용을 입력해주세요."
              {...register("content", {
                required: "내용을 입력해주세요.",
                onChange: e => {
                  setDataes(prev => {
                    return { ...prev, content: e.target.value };
                  });
                },
              })}
            />
            <div className="absolute left-[20px] bottom-[40px] w-[60px] h-[60px]">
              <FilUploader
                d={exist?.data?.images as string[]}
                setValue={setValue}
              ></FilUploader>
            </div>
          </div>

          <div className="flex justify-between relative">
            <div className="flex items-center gap-x-[13px]">
              <div>제출기간</div>
              <div
                className="w-[231px] h-[33px] cursor-pointer items-center bg-white relative flex justify-between py-[8px] pl-[10px] border rounded-[10px] gap-x-[10px] border-[#CCCCCC]"
                onClick={handleDisplayCalenderender}
              >
                <div>
                  <span id="left" className="opacity-0 hidden">
                    {dataes.startAt}
                  </span>

                  <span className="text-[14px] font-[400] leading-[16.8px]">
                    {dataes.startAt.slice(0, 4) +
                      ". " +
                      (dataes.startAt.slice(4, 7).trim().length === 1
                        ? "0" + dataes.startAt.slice(4, 7).trim()
                        : dataes.startAt.slice(4, 7)
                      ).trim() +
                      ". " +
                      (dataes.startAt.slice(7).trim().length === 1
                        ? "0" + dataes.startAt.slice(7).trim()
                        : dataes.startAt.slice(7).trim())}
                  </span>

                  <span
                    className={
                      "text-[14px] font-[400] leading-[16.8px] " +
                      (dataes.endAt ? " " : "opacity-0 ")
                    }
                  >
                    {" "}
                    ~{" "}
                  </span>

                  <span id="right" className="opacity-0 hidden">
                    {dataes.endAt}
                  </span>

                  <span
                    className={
                      "text-[14px] font-[400] leading-[16.8px] " +
                      (dataes.endAt ? " " : "opacity-0 ")
                    }
                  >
                    {dataes.endAt.slice(0, 4) +
                      ". " +
                      (dataes.endAt.slice(4, 7).trim().length === 1
                        ? "0" + dataes.endAt.slice(4, 7).trim()
                        : dataes.endAt.slice(4, 7)
                      ).trim() +
                      ". " +
                      (dataes.endAt.slice(7).trim().length === 1
                        ? "0" + dataes.endAt.slice(7).trim()
                        : dataes.endAt.slice(7).trim())}
                  </span>
                </div>
                <img
                  src="/images/Polygon 6.svg"
                  alt="polygon"
                  className="mr-[10px] w-[14px] h-[10.27px]"
                />
              </div>
            </div>
            {dataes.isModal && (
              <DatePicker
                dataes={dataes}
                setDataes={setDataes}
                endD={endD}
                setValue={setValue}
              ></DatePicker>
            )}
            <button
              className="h-[35px] bg-primary-80 rounded-[7px] py-[8px] px-[37px] text-[16px] leading-[19.2px] flex items-center justify-center text-white font-[700]"
              type="submit"
              onClick={() => {
                const createAte = getValues("createAt");
                if (createAte) {
                  setValue("updateAt", Timestamp.now());
                } else {
                  setValue("createAt", Timestamp.now());
                  setValue("updateAt", Timestamp.now());
                }
                if (getValues("endDate")) {
                  for (let i: number = 0; i < 2; i++) {
                    const arr: ["startDate", "endDate"] = [
                      "startDate",
                      "endDate",
                    ];
                    const answer: Timestamp[] = [
                      Timestamp.fromMillis(
                        Date.parse(dataes.startAt.replaceAll(" ", "-")),
                      ),
                      Timestamp.fromMillis(
                        Date.parse(dataes.endAt.replaceAll(" ", "-")),
                      ),
                    ];
                    setValue(arr[i], answer[i]);
                  }
                }
              }}
            >
              업로드
            </button>
            {(errors.title ||
              errors.content ||
              errors.level ||
              errors.endDate) && (
              <div className="w-[360px] h-[45px] border border-[#FF0000] rounded-[10px] py-[23px] px-[20px] flex items-center text-[12px] leading-[14.4px] font-[400] bg-[#FCF5F5] text-[#FF0000] absolute bottom-[0px] pointer-events-none">
                필수 입력 항목을 채워주세요
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

// {data.isModal && (
//   <DatePicker data={data} setData={setData}></DatePicker>
// )}
export default Modal;

{
  /* <tr className='flex gap-x-[10px]'>
        {days.sunday.map((ele,index) => (
          <td key={index}>
            {ele}
          </td>
        ))}
      </tr>
      <tr className='flex gap-x-[10px]'>
        {days.monday.map((ele,index) => (
          <td key={index}>
            {ele}
          </td>
        ))}
      </tr>
      <tr className='flex gap-x-[10px]'>
        {days.tuesday.map((ele,index) => (
          <td key={index}>
            {ele}
          </td>
        ))}
      </tr>
      <tr className='flex gap-x-[10px]'>
        {days.wednesday.map((ele,index) => (
          <td key={index}>
            {ele}
          </td>
        ))}
      </tr>
      <tr className='flex gap-x-[10px]'>
        {days.thursday.map((ele,index) => (
          <td key={index}>
            {ele}
          </td>
        ))}
      </tr>
      <tr className='flex gap-x-[10px]'>
        {days.friday.map((ele,index) => (
          <td key={index}>
            {ele}
          </td>
        ))}
      </tr>
      <tr className='flex gap-x-[10px]'>
        {days.saturday.map((ele,index) => (
          <td key={index}>
            {ele}
          </td>
        ))}
      </tr> */
}

// const handleEsc = (e: KeyboardEvent) => {
// 	if (e.key === "Escape"){
//     setDiff(false)
//   }

// };
// window.addEventListener("keydown", handleEsc);
// return () => window.removeEventListener("keydown", handleEsc);

// const check = () => {
//   const date = new Date().toLocaleDateString();
//   let total = date.split(".");
//   let month = total[1].trim();
//   if (month.length === 1) {
//     total[1] = "0" + month;
//   }
//   total[2] = total[2].trim();
//   total.pop();
//   return total.join(".");
// };
