# conftest.py
import time
import pytest

@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_call(item):
    start = time.perf_counter()
    yield
    duration = time.perf_counter() - start
    print(f"{item.name} terminé en {duration:.4f} secondes")
