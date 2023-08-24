use tokio::sync::RwLock;

#[tokio::main]
async fn main() {
    let lock = RwLock::new(5);

    // 多个读锁共存
    {
        // read()返回RwLockReadGuard
        let r1 = lock.read().await;
        let r2 = lock.read().await;
        assert_eq!(*r1, 5);  // 对Guard解引用，即可得到其内部的值
        assert_eq!(*r2, 5);
    } // 读锁(r1, r2)在此释放

    // 只允许一个写锁存在
    {
        // write()返回RwLockWriteGuard
        let mut w = lock.write().await;
        *w += 1;
        assert_eq!(*w, 6);
    } // 写锁(w)被释放
}
