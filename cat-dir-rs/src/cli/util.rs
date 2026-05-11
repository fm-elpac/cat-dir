//! 辅助命令 (小工具)

use crate::{
    core::{gen_raw_boundary, str_to_boundary},
    io::get_random,
};

/// 随机生成一个 boundary
/// cat-dir --boundary
pub fn c_boundary() {
    let b = get_random(32).unwrap();
    let o = gen_raw_boundary(b).unwrap();

    // 检查 boundary 是否正确
    match str_to_boundary(&o) {
        Some(_) => {
            // 成功
            println!("{}", o);
        }
        None => {
            // 失败
            panic!("gen boundary fail");
        }
    }
}
