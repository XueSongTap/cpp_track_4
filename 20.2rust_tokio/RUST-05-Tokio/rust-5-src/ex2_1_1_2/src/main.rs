use tokio;

fn main(){
  let rt = tokio::runtime::Runtime::new().unwrap();
  std::thread::sleep(std::time::Duration::from_secs(10));
}