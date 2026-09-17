import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime, time

# Cần import sau khi patch hoặc mock hợp lý, hoặc dùng mock thay thế
from app.services.notification_service import (
    get_my_notifications,
    get_unread_count,
    mark_as_read,
    mark_all_as_read,
    notify_reservation_created
)
from app.models.notification import Notification
from app.models.user import User
from app.models.role import Role
from app.models.reservation import Reservation
from fastapi import HTTPException


class TestNotificationService(unittest.TestCase):
    
    def setUp(self):
        self.db_session = MagicMock()

    # TEST GROUP 1 & 2: Get and Create Notifications
    def test_get_my_notifications(self):
        # Setup mock
        mock_query = self.db_session.query.return_value
        mock_base_filter = mock_query.filter.return_value
        
        # mock total count
        mock_base_filter.count.return_value = 10
        
        # mock unread count
        mock_base_filter.filter.return_value.count.return_value = 3
        
        # mock items
        mock_items = [Notification(id=1), Notification(id=2)]
        mock_base_filter.order_by.return_value.offset.return_value.limit.return_value.all.return_value = mock_items
        
        items, total, unread = get_my_notifications(self.db_session, user_id=1, skip=0, limit=10)
        
        self.assertEqual(len(items), 2)
        self.assertEqual(total, 10)
        self.assertEqual(unread, 3)

    # TEST GROUP 3: Read
    def test_mark_as_read_success(self):
        mock_notification = Notification(id=1, user_id=1, is_read=False)
        self.db_session.query.return_value.filter.return_value.first.return_value = mock_notification
        
        result = mark_as_read(self.db_session, notification_id=1, user_id=1)
        
        self.assertTrue(result.is_read)
        self.db_session.commit.assert_called_once()
        self.db_session.refresh.assert_called_once_with(mock_notification)

    def test_mark_as_read_wrong_user(self):
        mock_notification = Notification(id=1, user_id=2, is_read=False)
        self.db_session.query.return_value.filter.return_value.first.return_value = mock_notification
        
        with self.assertRaises(HTTPException) as context:
            mark_as_read(self.db_session, notification_id=1, user_id=1)
            
        self.assertEqual(context.exception.status_code, 403)
        self.db_session.commit.assert_not_called()

    def test_mark_all_as_read(self):
        self.db_session.query.return_value.filter.return_value.update.return_value = 5
        
        updated = mark_all_as_read(self.db_session, user_id=1)
        
        self.assertEqual(updated, 5)
        self.db_session.commit.assert_called_once()

    # TEST GROUP 4: Reservation Integration
    def test_notify_reservation_created_success(self):
        # Mock roles
        mock_admin_role = Role(id=1, name="ADMIN")
        mock_staff_role = Role(id=2, name="STAFF")
        
        # Mock users
        mock_users = [
            User(id=1, role_id=1, status="ACTIVE"), # Admin
            User(id=2, role_id=2, status="ACTIVE"), # Staff 1
            User(id=3, role_id=2, status="ACTIVE")  # Staff 2
        ]
        
        # Configure the db session query returns
        def mock_query_filter(model):
            mock_obj = MagicMock()
            if model == Role:
                mock_obj.filter.return_value.all.return_value = [mock_admin_role, mock_staff_role]
            elif model == User:
                mock_obj.filter.return_value.all.return_value = mock_users
            return mock_obj
            
        self.db_session.query.side_effect = mock_query_filter
        
        # Create reservation
        reservation = Reservation(
            id=100,
            customer_name="Test Customer",
            number_of_guests=4,
            reservation_code="RSV-TEST",
            start_time=time(19, 0),
            end_time=time(21, 0)
        )
        
        notify_reservation_created(self.db_session, reservation)
        
        # Assertions
        self.db_session.add_all.assert_called_once()
        notifications_added = self.db_session.add_all.call_args[0][0]
        
        self.assertEqual(len(notifications_added), 3) # 1 Admin + 2 Staff
        self.assertEqual(notifications_added[0].user_id, 1)
        self.assertEqual(notifications_added[0].type, "RESERVATION_CREATED")
        self.assertEqual(notifications_added[0].reference_id, 100)
        self.assertEqual(notifications_added[0].is_read, False)
        
        self.db_session.commit.assert_called_once()

    def test_notify_reservation_created_no_users(self):
        # Configure to return no users
        def mock_query_filter(model):
            mock_obj = MagicMock()
            if model == Role:
                mock_obj.filter.return_value.all.return_value = [Role(id=1, name="ADMIN")]
            elif model == User:
                mock_obj.filter.return_value.all.return_value = []
            return mock_obj
            
        self.db_session.query.side_effect = mock_query_filter
        
        reservation = Reservation(id=100)
        notify_reservation_created(self.db_session, reservation)
        
        self.db_session.add_all.assert_not_called()
        self.db_session.commit.assert_not_called()

if __name__ == '__main__':
    unittest.main()
