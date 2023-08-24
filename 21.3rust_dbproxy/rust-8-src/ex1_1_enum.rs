#[derive(Debug)]
enum PokerSuit { // 一副牌(poker
    Clubs, // 梅花
    Spades, // 黑桃
    Diamonds,// 方块
    Hearts, // 红桃
}
#[derive(Debug)]
enum PokerCard {
    Clubs(u8),
    Spades(u8),
    Diamonds(char),
    Hearts(char),
}

fn main() {
    let heart = PokerSuit::Hearts;
    let diamond = PokerSuit::Diamonds;

    print_suit(heart);
    print_suit(diamond);

    let c1 = PokerCard::Spades(5);
    let c2 = PokerCard::Diamonds('A');
    print_card(c1);
    print_card(c2);
    let c1 = PokerCard::Spades(5);
    let mut c2 = PokerCard::Diamonds('A');
    c2 = c1;    // 可以正常赋值
    print_card(c2);  //  Spades(5)
}

fn print_suit(card: PokerSuit) {
    println!("{:?}",card);
}
fn print_card(card: PokerCard) {
    println!("{:?}",card);
}