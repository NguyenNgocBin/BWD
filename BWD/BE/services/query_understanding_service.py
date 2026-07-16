import re
import unicodedata


INTENT_KNOWLEDGE = "dong_son_knowledge"
INTENT_ARTIFACT = "artifact"
INTENT_WEBSITE = "website"
INTENT_ACCOUNT_GAME = "account_game"
INTENT_OUT_OF_SCOPE = "out_of_scope"
INTENT_AMBIGUOUS = "ambiguous"

ENTITY_ALIASES = {
    "ngoc_lu": ("ngoc lu", "trống đồng Ngọc Lũ"),
    "hoang_ha": ("hoang ha", "trống đồng Hoàng Hạ"),
    "co_loa": ("co loa", "trống đồng Cổ Loa"),
    "tan_long": ("tan long", "trống đồng Tân Long"),
    "chim_lac": ("chim lac", "hoa văn chim Lạc"),
    "mat_troi": ("mat troi", "hình mặt trời trung tâm mặt trống"),
    "heger": ("heger", "phân loại Heger trống đồng"),
}

ARTIFACT_ENTITIES = {"ngoc_lu", "hoang_ha", "co_loa", "tan_long"}
MISSING_KNOWLEDGE_ENTITIES = set()

MISSING_ENTITY_DETAILS = {
    "tan_long": ("luu giu", "dang trung bay", "trung bay o dau", "hien nay o dau"),
}

TERM_EXPANSIONS = {
    "bxh": "bảng xếp hạng",
    "password": "mật khẩu",
    "pass": "mật khẩu",
    "3d": "triển lãm mô hình 3D",
    "ai": "chatbox AI Đông Sơn",
    "mat trong": "cấu tạo mặt trống đồng Đông Sơn",
    "phan loai": "hệ thống phân loại Heger",
    "van hoa khao co": "văn hóa khảo cổ Đông Sơn",
    "bat dau hoc": "trang Học vui và Lộ trình học",
}

TYPO_REPLACEMENTS = {
    "trog": "trong",
    "ngia": "nghia",
    "nghiaa": "nghia",
    "ki": "ky",
    "kỉ": "ky",
    "xep hag": "xep hang",
    "hom nai": "hom nay",
    "he go": "heger",
    "phang loai": "phan loai",
    "sua sao": "xu ly the nao",
    "ko": "khong",
}

OUT_OF_SCOPE_PATTERNS = (
    "thoi tiet", "bitcoin", "co phieu", "chan doan", "dau dau", "uong thuoc",
    "python", "react", "doan code", "nau pho", "cong thuc lam banh", "world cup",
    "ty so tran", "tin tuc noi bat", "ceo", "api key", "lay mat khau nguoi dung",
    "danh sach mat khau", "kim tu thap", "de quoc la ma", "bangkok co mua",
)

ACCOUNT_GAME_TERMS = (
    "dang nhap", "dang ky", "tai khoan", "mat khau", "bang xep hang",
    "password", "pass", "bxh", "game", "tro choi", "ho so", "profile", "luu",
    "dong bo", "avatar",
)

WEBSITE_TERMS = (
    "website", "trang nao", "chuc nang", "ban do", "trien lam", "mo hinh 3d",
    "mo hinh", "3d", "lo trinh", "hoc theo", "bat dau hoc", "nguoi moi", "mo trang",
    "chatbox", "tro ly", "bao tang so", "xem ho so",
)

SCORE_TERMS = (
    "diem game", "diem choi", "luu diem", "tong diem", "diem cua toi", "diem khong",
    "diem ko", "diem chua", "diem tren", "diem len", "cong diem",
)

UNSUPPORTED_FEATURE_PATTERNS = (
    "quen mat khau", "reset password", "link reset", "lay lai mat khau",
)

PRIVACY_PATTERNS = (
    "email cua nguoi", "email nguoi dung", "danh sach email",
)

AMBIGUOUS_PATTERNS = (
    "no duoc", "cai do", "bieu tuong ay", "hinh do", "cai ay", "con cai do",
)


def strip_accents(text):
    normalized = unicodedata.normalize("NFD", str(text or ""))
    return "".join(character for character in normalized if unicodedata.category(character) != "Mn").replace("đ", "d").replace("Đ", "D")


def normalize_unicode(text):
    return unicodedata.normalize("NFKC", str(text or "")).strip()


def normalize_for_keyword(text):
    value = strip_accents(normalize_unicode(text)).lower()
    value = re.sub(r"[^a-z0-9]+", " ", value)
    value = " ".join(value.split())
    for typo, replacement in TYPO_REPLACEMENTS.items():
        value = re.sub(rf"\b{re.escape(typo)}\b", replacement, value)
    return value


def tokenize_for_bm25(text):
    return [token for token in normalize_for_keyword(text).split() if len(token) > 1]


def detect_entities(keyword_text):
    return [
        entity
        for entity, (alias, _) in ENTITY_ALIASES.items()
        if alias in keyword_text
    ]


def classify_intent(keyword_text, entities):
    if any(pattern in keyword_text for pattern in AMBIGUOUS_PATTERNS) and not entities:
        return INTENT_AMBIGUOUS
    if any(pattern in keyword_text for pattern in OUT_OF_SCOPE_PATTERNS + PRIVACY_PATTERNS):
        return INTENT_OUT_OF_SCOPE
    if "ho so" in keyword_text and "hien vat" in keyword_text:
        return INTENT_WEBSITE
    if entities and any(
        signal in keyword_text
        for signal in ("trang nao", "tren website", "mo trang", "xem ho so")
    ):
        return INTENT_WEBSITE
    if any(entity in ARTIFACT_ENTITIES for entity in entities):
        return INTENT_ARTIFACT
    if any(term in keyword_text for term in ACCOUNT_GAME_TERMS + SCORE_TERMS):
        return INTENT_ACCOUNT_GAME
    if any(term in keyword_text for term in WEBSITE_TERMS):
        return INTENT_WEBSITE
    if "hien vat" in keyword_text:
        return INTENT_ARTIFACT
    return INTENT_KNOWLEDGE


def allowed_source_intents(intent):
    return {
        INTENT_KNOWLEDGE: [INTENT_KNOWLEDGE, INTENT_ARTIFACT],
        INTENT_ARTIFACT: [INTENT_ARTIFACT, INTENT_KNOWLEDGE],
        INTENT_WEBSITE: [INTENT_WEBSITE, INTENT_ACCOUNT_GAME],
        INTENT_ACCOUNT_GAME: [INTENT_ACCOUNT_GAME, INTENT_WEBSITE],
    }.get(intent, [])


def understand_query(question):
    normalized = normalize_unicode(question)
    keyword_text = normalize_for_keyword(normalized)
    entities = detect_entities(keyword_text)
    intent = classify_intent(keyword_text, entities)
    missing_entity = any(entity in MISSING_KNOWLEDGE_ENTITIES for entity in entities)
    missing_entity_detail = any(
        entity in entities
        and any(pattern in keyword_text for pattern in patterns)
        for entity, patterns in MISSING_ENTITY_DETAILS.items()
    )
    unsupported_feature = any(
        pattern in keyword_text for pattern in UNSUPPORTED_FEATURE_PATTERNS
    )
    unverified_interpretation = (
        any(subject in keyword_text for subject in ("mat troi", "ngoi sao"))
        and any(
            pattern in keyword_text
            for pattern in ("y nghia", "tuong trung", "tai sao", "vi sao")
        )
    )

    expansions = []
    for entity in entities:
        expansions.append(ENTITY_ALIASES[entity][1])
    for term, expansion in TERM_EXPANSIONS.items():
        if re.search(rf"\b{re.escape(term)}\b", keyword_text):
            expansions.append(expansion)

    expanded_text = normalized
    if expansions:
        expanded_text = f"{normalized}\nTừ khóa chuẩn hóa: {'; '.join(dict.fromkeys(expansions))}"

    return {
        "original": question,
        "normalized": normalized,
        "keyword_text": keyword_text,
        "expanded_text": expanded_text,
        "entities": entities,
        "intent": intent,
        "allowed_intents": allowed_source_intents(intent),
        "should_reject": (
            intent in {INTENT_OUT_OF_SCOPE, INTENT_AMBIGUOUS}
            or missing_entity
            or missing_entity_detail
            or unsupported_feature
            or unverified_interpretation
        ),
        "rejection_reason": (
            "missing_knowledge"
            if missing_entity or missing_entity_detail or unverified_interpretation
            else "unsupported_feature"
            if unsupported_feature
            else intent
            if intent in {INTENT_OUT_OF_SCOPE, INTENT_AMBIGUOUS}
            else None
        ),
    }


def classify_source_intent(source):
    if source.startswith("knowledge/artifacts/"):
        return INTENT_ARTIFACT
    if source.startswith("knowledge/website/"):
        filename = source.rsplit("/", 1)[-1]
        if filename in {"tai_khoan.md", "tro_choi.md", "xep_hang.md"}:
            return INTENT_ACCOUNT_GAME
        return INTENT_WEBSITE
    if source.startswith("knowledge/faq/"):
        return INTENT_KNOWLEDGE
    return INTENT_KNOWLEDGE


def source_entities(text):
    keyword_text = normalize_for_keyword(text)
    return ",".join(detect_entities(keyword_text))
