#[derive(Debug)]
pub struct Rectangle {
    pub width: u32,
    pub height: u32
}

pub fn cal_area(rec : &Rectangle) -> u32 {
    rec.height * rec.width
}

pub fn build_rec(width: u32, height: u32) -> Rectangle {
    Rectangle {
        width,
        height
    }
}