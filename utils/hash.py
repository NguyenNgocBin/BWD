import bcrypt


# Bam mat khau bang bcrypt truoc khi luu vao database.
def hash_password(password):
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")


# So sanh mat khau nguoi dung nhap voi password hash trong database.
def check_password(password, password_hash):
    return bcrypt.checkpw(
        password.encode("utf-8"),
        password_hash.encode("utf-8"),
    )
