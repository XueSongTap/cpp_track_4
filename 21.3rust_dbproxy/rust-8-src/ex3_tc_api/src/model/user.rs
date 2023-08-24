use sqlx::FromRow;
use serde::{Deserialize, Serialize};

#[derive( Deserialize, Debug)]
pub struct UserRegister {
    #[serde(rename = "userName")]
    pub user_name: String,
    #[serde(rename = "firstPwd")]
    pub first_pwd: String,
    #[serde(rename = "nickName")]
    pub nick_name: String,
    pub phone: String,
    pub email: String,
}
#[derive(Serialize, Debug)]
pub struct UserRegisterResp {
    pub code: i32,
}

#[derive(Deserialize, Debug)]
pub struct UserLogin {
    pub user: String,  // 用户名
    pub pwd: String,    // 密码
}
#[derive(Serialize, Deserialize, Debug)]
pub struct UserLoginResp {
    pub code: i32,      // 返回状态
    pub token: String,  // 成功时的token
}

#[derive(sqlx::FromRow)]
# [derive (Debug)]
pub struct UserPassword {
    pub user_name: String,
    pub password: String,
}
