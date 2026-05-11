//! 高质量随机数
//!
//! `/dev/urandom` 级别
use getrandom;

/// 获取指定 字节数 的随机数据
pub fn get_random(n: usize) -> Result<Vec<u8>, getrandom::Error> {
    let mut b = vec![0; n];
    getrandom::fill(&mut b)?;
    Ok(b)
}
