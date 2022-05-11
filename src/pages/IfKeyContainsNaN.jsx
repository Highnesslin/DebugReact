import {React, useState} from "../CONST";


export default function Main() {
  const [arr, setArr] = useState([
    {
      name: 'A',
    },
    {
      name: 'B',
    },
    {
      name: 'C',
    }
  ]);

  const add = () => {
    setArr((arr) => {
      const nextArr = arr.slice(0);
      nextArr[1] = {
        name: Math.random(),
        url: Math.random()
      };
      return nextArr;
    });
  };

  /**
   * NaN NaN NaN
   * NaN B NaN
   * 
   * const map = {
   *  NaN:C
   * }
   */
  return (
    <div>
      <button onClick={add}>add</button>
      {arr.map((item, index) => {
        return (
          <div style={{border: '1px solid #0af'}} key={'NaN'}>
            <p>{item.name}</p>
            <p>{item.url}</p>
          </div>
        );
      })}
    </div>
  );
};
