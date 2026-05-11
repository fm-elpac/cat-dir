//! 命令行程序 (CLI)
use std::process::ExitCode;

//use log::{debug, info};

mod a;
mod err;
mod simple;
mod util;

use a::{CliArg, SimpleArg};

use simple::c_simple;
use util::c_boundary;

/// 命令行入口
pub fn main(a: Vec<String>) -> Result<(), ExitCode> {
    match CliArg::from(a) {
        CliArg::Help | CliArg::HelpZh => {
            // TODO
            println!("TODO");

            Ok(())
        }

        CliArg::Boundary => {
            c_boundary();
            Ok(())
        }
        CliArg::Simple(a) => c_simple(a),

        CliArg::Err(s) => {
            eprintln!("ERROR: {}", s);
            Err(ExitCode::from(1))
        }
    }
}
