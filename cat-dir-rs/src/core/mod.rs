//! 核心: 纯计算 部分, 无 IO

mod block;
mod boundary;
mod cat;
mod err;
mod ext;
mod meta;
mod path;
mod plugin;
mod spec;

pub use boundary::{
    BOUNDARY_CHAR_MAX, BOUNDARY_CHAR_MIN, BOUNDARY_DASH, BOUNDARY_MAX_SIZE, BOUNDARY_N,
    check_boundary, gen_raw_boundary, get_end_boundary, str_to_boundary,
};

// TODO
