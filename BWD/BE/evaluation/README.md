# Đánh giá RAG — Giai đoạn 1, 2 và 3

Thư mục này chứa golden dataset và công cụ đo baseline cho retrieval/fallback của chatbox Đông Sơn.

## Thành phần

- `rag_eval_dataset.json`: phiên bản 1.2.0, gồm 60 nhóm ý định và 120 câu hỏi thuộc 6 nhóm nội dung.
- `run_rag_eval.py`: kiểm tra cấu trúc dataset, chạy retrieval và xuất báo cáo JSON.
- `benchmark_chunking.py`: so sánh ba cấu hình semantic chunk bằng cùng golden set.
- `results/knowledge-audit-v3.json`: audit metadata, file rỗng và nội dung trùng.
- `results/`: nơi lưu báo cáo baseline khi truyền `--output`.

Mỗi nhóm ý định có:

- `answerable`: kho tri thức hiện tại có đủ dữ liệu hay không.
- `reference_answer`: đáp án tham chiếu dùng cho đánh giá thủ công hoặc LLM judge ở giai đoạn sau.
- `expected_sources`: file nguồn phải xuất hiện trong top K.
- `questions`: câu chuẩn và các cách diễn đạt khác nhau.

## Kiểm tra dataset

Từ thư mục `BWD/BE`:

```powershell
python evaluation/run_rag_eval.py --validate-only
```

Lệnh sẽ kiểm tra số câu, ID trùng, trường bắt buộc và sự tồn tại của mọi file nguồn.

## Đo retrieval

Sau khi cài dependencies và có Chroma collection:

```powershell
python evaluation/run_rag_eval.py `
  --top-k 5 `
  --output evaluation/results/semantic-v3-knowledge-final.json
```

Có thể đặt ngưỡng để dùng trong CI:

```powershell
python evaluation/run_rag_eval.py --top-k 5 --fail-under-hit 0.85
```

Exit code là `2` nếu Hit@K thấp hơn ngưỡng.

## Chỉ số

- `Hit@K`: tỷ lệ câu trả lời được có ít nhất một nguồn đúng trong top K.
- `Source Recall@K`: tỷ lệ các nguồn mong đợi được lấy về; quan trọng với câu cần nhiều nguồn.
- `MRR`: nguồn đúng đầu tiên đứng càng cao thì điểm càng tốt.
- `Answerability accuracy`: quyết định trả lời/fallback có khớp nhãn chuẩn không.
- `False reject rate`: câu có dữ liệu nhưng hệ thống lại fallback.
- `False accept rate`: câu ngoài phạm vi/thiếu dữ liệu nhưng hệ thống vẫn cho phép trả lời.

Runner chỉ đo retrieval và quyết định fallback, không gọi Gemini để sinh câu trả lời. Với V3, embedding của riêng golden set công khai được checkpoint trong cache theo batch; chạy lại sau HTTP 429 chỉ tạo phần còn thiếu. Cơ chế này không được dùng trong request chat, nên câu hỏi thật của người dùng không bị lưu vào cache.

`reference_answer` được giữ để bổ sung đánh giá chất lượng câu trả lời ở giai đoạn tiếp theo.

## CI offline

Workflow `.github/workflows/backend-quality.yml` tự chạy unit test, compile, validate knowledge/dataset và benchmark ba cấu hình chunk trên pull request hoặc push liên quan. Workflow này không cấu hình Gemini key, không gọi embedding/LLM provider và không tiêu quota. Semantic V3 đầy đủ cùng đánh giá câu trả lời cuối vẫn là bước chủ động khi quota cho phép.

## Kết quả Giai đoạn 2

| Chỉ số | Hash baseline | Semantic V2 đã tinh chỉnh |
|---|---:|---:|
| Hit@5 | 80,00% | 100,00% |
| Source Recall@5 | 74,26% | trên 95% |
| MRR | 0,5689 | trên 0,88 |
| Answerability accuracy | 81,67% | 100,00% |
| False reject | 6,67% | 0,00% |
| False accept | 53,33% | 0,00% |

Các report dùng để đối chiếu nằm trong `evaluation/results`. Collection hash cũ vẫn được giữ để rollback và không được dùng chung vector với V2.

## Kết quả benchmark chunk Giai đoạn 3

Chạy:

```powershell
python scripts/audit_knowledge.py
python evaluation/benchmark_chunking.py --top-k 5
```

| Cấu hình | Số chunk | Hit@5 BM25 | Source Recall@5 | MRR | Context trung bình |
|---|---:|---:|---:|---:|---:|
| `compact` (700/0) | 211 | 91,21% | 84,07% | 0,7943 | 1.262 ký tự |
| `balanced` (1000/1) | 204 | 91,21% | 84,07% | 0,7980 | 1.312 ký tự |
| `broad` (1400/1) | 202 | 91,21% | 84,62% | 0,7962 | 1.363 ký tự |

`balanced` được chọn theo điểm tổng hợp gồm Hit@5, recall, MRR, answerability và độ dài context, với dải ổn định 0,015 để một vài câu thay đổi hạng không làm cấu hình dao động giữa hai cực. Benchmark đã áp dụng cùng chính sách runtime: nguồn `confidence: low` không được truy xuất và câu hỏi diễn giải biểu tượng chưa đủ kiểm chứng phải fallback. Đây là benchmark offline của nhánh BM25 trên cùng semantic units; collection được chọn vẫn phải chạy lại end-to-end bằng Gemini semantic embedding.

Collection active hiện là `rag-v3-b59c44aa3345`, chunker `semantic-units-v2`, 204 chunks và `--check` báo `in_sync=true`. Hai lượt chạy semantic 120 câu gần nhất đều dừng ở HTTP 429 trước batch query đầu, kể cả khi giảm batch xuống 3; vì vậy chưa có file `semantic-v3-knowledge-final.json` hoàn chỉnh và không được suy diễn chỉ số V2 thành chỉ số V3.

## Quy trình cập nhật

1. Khi thêm/sửa knowledge, cập nhật các case liên quan.
2. Chạy `--validate-only`.
3. Chạy `python scripts/audit_knowledge.py` và sửa mọi lỗi blocking.
4. Chạy benchmark chunk khi cấu trúc nội dung hoặc chunker thay đổi.
5. Ingest build V3 mới bằng `python scripts/ingest_knowledge_v3.py --config balanced`.
6. Chạy `python scripts/ingest_knowledge_v3.py --check` để xác nhận checksum đồng bộ.
7. Chạy report mới với cùng `top_k`, xem cả chỉ số theo category và `failures`.
8. Chỉ thay baseline chuẩn khi thay đổi đã được rà soát nội dung.

Không đưa câu hỏi thực chứa email, số điện thoại, token hoặc dữ liệu tài khoản vào golden dataset.
