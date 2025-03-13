import pytest

def pytest_addoption(parser):
    """ Fügt eine Option --asin für pytest hinzu. """
    parser.addoption("--asin", action="store", default=None, help="ASIN für den Test")

@pytest.fixture
def asin_param(request):
    """ Holt die ASIN aus der CLI, wenn sie über --asin übergeben wurde """
    return request.config.getoption("--asin")
