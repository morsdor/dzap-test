import { useRef, useState } from "react";
import classes from "./Disperse.module.css";
import ErrorIcon from "./ErrorIcon";

export default function Disperse() {
  const [errMessage, setErrMesaage] = useState([]);
  const [isError, setIsError] = useState(false);
  const [list, setList] = useState(<div>1</div>);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const addressRef = useRef("");
  const dataLength = useRef(0);
  const lineCounterRef = useRef();

  /**
   * function to handle textarea onChange event and create a line counter list
   */
  function handleTextAreaChange() {
    const text = addressRef.current.value;
    //split based on new line
    const dataPoint = text.split(/\n/);
    if (dataPoint.length !== dataLength.current) {
      //list to hold the count of lines in textarea
      const lists = dataPoint.map((el, idx) => {
        return <div key={idx}>{idx + 1}</div>;
      });
      dataLength.current = lists.length
      setList(lists);
    }
  }

  /**
   * function to match the scroll position of line counter div to textarea
   */
  function handleTextareaScroll() {
    if (lineCounterRef.current && addressRef.current) {
      lineCounterRef.current.scrollTop = addressRef.current.scrollTop;
    }
  }

  /**
   * function to handle once button is clicked
   */
  function onSubmit() {
    const text = addressRef.current.value;
    const lineArray = text.split(/\n/);
    validateData(lineArray);
  }

  /**
   * Function to some basic validations
   * @param {*} lineArray An array of each line from textarea control
   */
  function validateData(lineArray) {
    const resultArr = [];
    let isError = false;
    let errMsg = [] ;

    lineArray.forEach((el) => {
      //split string based on , = or white space(\s)
      const splitArr = el.split(/[=\s,]/);
      resultArr.push(splitArr);
    });

    for (let [idx, el] of resultArr.entries()) {
      if (el.length !== 2) {
        //Show error if more than two entries -> id and amount
        errMsg.push(<p>{`Invalid data at line ${idx + 1}`}</p>)
        isError = true;
      } else if (el.length === 2) {
        //Show error when id length is different than 42 chars or soesn't start with 0x
        if (el[0].length !== 42 || !el[0].startsWith("0x")) {
          setIsError(true);
          errMsg.push(<p>{`Invalid data at line ${idx + 1}`}</p>)
          isError = true;
        } else {
          const amount = Number(el[1]);
          if (Number.isNaN(amount)) {
            //show error when amount is NaN
            errMsg.push(<p>{`Line ${idx + 1} wrong Amount`}</p>)
            isError = true;
          }
        }
      }
    }

    if (isError) {
      setErrMesaage(errMsg);
      setIsError(true);
    } else {
      const map = validateDuplicates(resultArr);
      return map;
    }
  }

  /**
   * Function to check for duplicates
   * @param {*} resultArr An array of each [address , amount]
   */
  function validateDuplicates(resultArr) {
    let errMsg = [];
    let isError = false;

    const map = new Map();
    const addresses = resultArr.map((el) => el[0]);
    addresses.forEach((el, idx) => {
      if (!map.has(el)) {
        map.set(el, [{ index: idx, amount: resultArr[idx][1] }]);
      } else {
        const arr = map.get(el);
        arr.push({ index: idx, amount: resultArr[idx][1] });
      }
    });
    if (map.size > 0) {
      for (let [mapKey, mapValue] of map.entries()) {
        if (mapValue.length > 1) {
          const idxArray = mapValue.map((el) => el.index + 1);
          errMsg.push(<p>{`Address ${mapKey} encountered duplicate in Line ${idxArray.toString()}`}</p>)
          isError = true;
        }
      }
    }
    if (isError) {
      setIsDuplicate(true);
      setIsError(true);
      setErrMesaage(errMsg);
    } else {
      setIsDuplicate(false);
      setIsError(false);
      setErrMesaage([]);
    }

    return map;
  }

  function keepFirstOne() {
    const text = addressRef.current.value;
    const lineArray = text.split(/\n/);
    //want to validate again becuase maybe user has entered some more data or modified since last validation
    const map = validateData(lineArray);
    let str = "";
    if (map && map.size > 0) {
      for (let [key, value] of map.entries()) {
        str = `${str}${key} ${value[0].amount}\n`;
      }
      str = str.slice(0, str.length - 1);
      addressRef.current.value = str;

      handleTextAreaChange();
      setIsDuplicate(false);
      setIsError(false);
      setErrMesaage([]);
    }
  }

  function combineDuplicates() {
    const text = addressRef.current.value;
    const lineArray = text.split(/\n/);
    //want to validate again becuase maybe user has entered some more data or modified since last validation
    const map = validateData(lineArray);
    let str = "";

    if (map && map.size > 0) {
      for (let [key, value] of map.entries()) {
        if (value.length > 1) {
          const totalAmount = value.reduce(
            (acc, el) => acc + Number(el.amount),
            0
          );
          str = `${str}${key} ${totalAmount}\n`;
        } else {
          str = `${str}${key} ${value[0].amount}\n`;
        }
      }

      addressRef.current.value = str.slice(0, str.length - 1);
      handleTextAreaChange();
      setIsDuplicate(false);
      setIsError(false);
      setErrMesaage([]);
    }
  }

  return (
    <div className={classes.container}>
      <div className={classes["text-container"]}>
        <p>Addresses with amounts</p>
        <div className={classes["textarea-container"]}>
          <div ref={lineCounterRef} className={classes.lined}>
            {list}
          </div>
          <textarea
            ref={addressRef}
            onChange={handleTextAreaChange}
            onScroll={handleTextareaScroll}
          ></textarea>
        </div>
        <p>Seaparated by ',' or ' ' or '='</p>
      </div>
      {isError && (
        <div className={classes["error-row"]}>
          {isDuplicate && (
            <div className={classes["duplicate-error-row"]}>
              <div>Duplicated</div>
              <div style={{ display: "flex", gap: "0.3rem" }}>
                <div className={classes["method-hover"]} onClick={keepFirstOne}>
                  Keep the first one{" "}
                </div>
                <div> | </div>
                <div
                  className={classes["method-hover"]}
                  onClick={combineDuplicates}
                >
                  Combine Balance
                </div>
              </div>
            </div>
          )}
          <div className={classes["error-container"]}>
            <div className={classes["error-icon"]}>
              <ErrorIcon />
            </div>
            <div className={classes["error-msg"]}>{errMessage}</div>
          </div>
        </div>
      )}
      <button onClick={onSubmit}>NEXT</button>
    </div>
  );
}
