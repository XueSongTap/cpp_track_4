use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    // 创建容量为1的通道
    let (tx, mut rx) = mpsc::channel(1);
    // 申请并占有唯一的空闲位置
    let permit = tx.reserve().await.unwrap();
    // 唯一的位置已被permit占有，tx.send()无法发送消息
    assert!(tx.try_send(123).is_err());
    // Permit可以通过send()方法向它占有的那个位置发送消息
    permit.send(456);
    // Receiver端接收到消息
    assert_eq!(rx.recv().await.unwrap(), 456);


    // 创建容量为1的通道
    let (tx, mut rx) = mpsc::channel(1);
    // tx.reserve_owned()会消费掉tx
    let permit = tx.reserve_owned().await.unwrap();
    // 通过permit.send()发送消息，它又返回一个Sender
    let tx = permit.send(456);
    assert_eq!(rx.recv().await.unwrap(), 456);
    //可以继续使用返回的Sender发送消息
    tx.send(789).await.unwrap();
}
