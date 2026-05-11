//! 块 随机 分隔符
use base64::{Engine as _, engine::general_purpose::URL_SAFE};

/// boundary 特殊字节 `\n` 0x0a
pub const BOUNDARY_N: u8 = b'\n';

/// boundary 特殊字节 `-` (用于 头, 尾)
pub const BOUNDARY_DASH: u8 = b'-';

/// boundary 字符集范围 (ASCII 非控制字符)
pub const BOUNDARY_CHAR_MIN: u8 = 0x20;
pub const BOUNDARY_CHAR_MAX: u8 = 0x7e;

/// boundary 最大长度: 255 字节
pub const BOUNDARY_MAX_SIZE: u8 = 255;

/// 检查 boundary 格式是否正确
///
/// (1) 长度至少 15 字节 (至少 64bit 随机性).
///     最大长度 255 字节.
///
/// (2) 开头/结尾 必需是 `\n` 字节
///
/// (3) 中间不能有 `\n` 字节.
///
/// (4) ASCII 字符, 非控制字符.
///
/// (5) 字符串必需以 `--` 开头.
pub fn check_boundary(b: &[u8]) -> Result<(), u8> {
    // (1)
    if (b.len() < 15) || (b.len() > (BOUNDARY_MAX_SIZE as usize)) {
        return Err(1);
    }

    // (2)
    if (b[0] != BOUNDARY_N) || (b[b.len() - 1] != BOUNDARY_N) {
        return Err(2);
    }

    for i in 1..(b.len() - 1) {
        // (3)
        if b[i] == BOUNDARY_N {
            return Err(3);
        }
        // (4)
        if (b[i] < BOUNDARY_CHAR_MIN) || (b[i] > BOUNDARY_CHAR_MAX) {
            return Err(4);
        }
    }

    // (5)
    if (b[1] != BOUNDARY_DASH) || (b[2] != BOUNDARY_DASH) {
        return Err(5);
    }

    Ok(())
}

/// 字符串 转 完整 boundary
///
///
/// 生成失败 返回 None
pub fn str_to_boundary(s: &str) -> Option<Vec<u8>> {
    let b: Vec<u8> = format!("\n{}\n", s).as_bytes().into();
    match check_boundary(&b) {
        Ok(_) => Some(b),
        Err(_) => None,
    }
}

/// 生成 字符串 格式的 boundary
///
/// random: 至少输入 32 字节 高质量 随机数
///
/// 生成失败 返回 None
pub fn gen_raw_boundary(random: Vec<u8>) -> Option<String> {
    if random.len() < 32 {
        return None;
    }

    // base64 随机字节
    let b1 = URL_SAFE.encode(random);
    // 取前 23 个字符
    let (b2, _) = b1.split_at(23);

    // 按固定格式生成
    let o = format!("--FileBoundary-{}", b2);
    // 长度必需是 38 (固定)
    if o.len() != 38 { None } else { Some(o) }
}

/// 从 raw boundary 获取 boundary-- 结束标记
pub fn get_end_boundary(boundary: &str) -> String {
    format!("{}--", boundary)
}
