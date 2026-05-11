//! # 喵夹 (cat-dir)
//!
//! <https://github.com/fm-elpac/cat-dir>
//!
//! cat-dir: Bundle directory tree into one plain-text file. (like tar, but you can `cat` it)
//!
//! TODO
//!
#![deny(unsafe_code)]

pub mod cli;
pub mod core;
pub mod io;

mod locale;

mod plugin;
mod rt;
mod t;
