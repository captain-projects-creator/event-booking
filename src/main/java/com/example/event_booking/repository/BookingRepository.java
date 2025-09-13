package com.example.event_booking.repository;

import com.example.event_booking.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserId(Long userId);
    List<Booking> findByEventId(Long eventId);

    // Useful derived queries:
    long countByEventId(Long eventId);
    boolean existsByUserIdAndEventId(Long userId, Long eventId);

    void deleteByEventId(Long eventId);
}
