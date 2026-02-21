"""Unit tests for database proxy behavior."""

import pytest

from app.db import DatabaseProxy


class _DummyDB:
    def __init__(self):
        self.users = object()
        self.quizzes = object()


class TestDatabaseProxy:
    def test_proxy_raises_when_unbound(self):
        proxy = DatabaseProxy()

        with pytest.raises(RuntimeError, match="not connected"):
            _ = proxy.users

    def test_proxy_forwards_attributes_when_bound(self):
        proxy = DatabaseProxy()
        dummy = _DummyDB()
        proxy.bind(dummy)

        assert proxy.users is dummy.users
        assert proxy.quizzes is dummy.quizzes

    def test_proxy_unbind_restores_guard(self):
        proxy = DatabaseProxy()
        proxy.bind(_DummyDB())
        proxy.unbind()

        with pytest.raises(RuntimeError, match="not connected"):
            _ = proxy.users
