import pytest

def pytest_addoption(parser):
    """Fügt das `--asin` CLI-Argument zu PyTest hinzu."""
    parser.addoption("--asin", action="store", default=None, help="ASIN for test_specific_asin")

@pytest.fixture
def asin_param(request):
    """Stellt die ASIN als Fixture bereit."""
    return request.config.getoption("--asin")
