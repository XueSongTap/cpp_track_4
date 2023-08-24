use ex_test1::rectangle::build_rec;
use ex_test1::rectangle::cal_area;
#[cfg(test)]
mod rec_test {
    // 引入模块
    use super::*;

    #[test]
    fn test_build_rec() {
        let rec = build_rec(10, 10);
        assert_eq!(rec.width, 10);
        assert_eq!(rec.height, 10);
    }

    #[test]
    fn test_area() {
        let rec = build_rec(100, 100);
        let area = cal_area(&rec);
        assert_eq!(area, 10000);
    }
}