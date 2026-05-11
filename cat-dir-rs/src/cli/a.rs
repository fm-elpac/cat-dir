//! 命令行参数 解析, 环境变量 处理

/// 命令行参数 解析结果
#[derive(Debug, Clone)]
pub enum CliArg {
    /// 命令行格式错误
    Err(String),
    /// --help
    Help,
    /// --帮助
    HelpZh,
    /// --boundary
    Boundary,
    /// --simple 输出 输入1 输入2 ...
    /// -s *
    Simple(SimpleArg),
    // TODO 支持更多命令
}

/// --simple 命令参数
#[derive(Debug, Clone)]
pub struct SimpleArg {
    pub output: String,
    pub input: Vec<String>,
}

impl From<Vec<String>> for CliArg {
    fn from(a: Vec<String>) -> Self {
        if a.len() > 0 {
            // 剩余参数
            let r: Vec<String> = (&a[1..]).into();

            // 第 1 个参数
            match a[0].as_str() {
                // 忽略 剩余参数
                "--help" => Self::Help,
                "--帮助" => Self::HelpZh,
                // 没有更多参数
                "--boundary" => {
                    if 1 == a.len() {
                        Self::Boundary
                    } else {
                        Self::Err("bad command (--boundary)".into())
                    }
                }
                // 简单模式: 至少 2 个参数
                "--simple" | "-s" => {
                    if r.len() < 2 {
                        Self::Err("bad command (--simple)".into())
                    } else {
                        // 第 1 个是 输出, 其余 是 输入
                        Self::Simple(SimpleArg {
                            output: r[0].clone(),
                            input: (&r[1..]).into(),
                        })
                    }
                }

                // 未知命令
                x => Self::Err(format!("unknown command: {}", x)),
            }
        } else {
            Self::Err("bad command".into())
        }
    }
}
