import { React, Component } from '../CONST';

class ClassComponent extends Component {
  render() {
    return <div className='class border'>{this.props.name}</div>;
  }
}

function FunctionComponent({ name }) {
  return (
    <div className='function border'>
      {name}
      <button onClick={() => console.log('omg')}>click</button>
    </div>
  );
}

const jsx = () => (
  <div className='box border'>
    <p>哈哈哈哈哈哈哈哈</p>
    <a href='https://kaikeba.com/'>啦啦啦啦啦啦啦啦</a>
    <FunctionComponent name='函数组件' />
    <ClassComponent name='class组件' />
  </div>
);

export default jsx;
