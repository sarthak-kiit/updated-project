package com.sarthak.skillbuilder.repository;

import com.sarthak.skillbuilder.entity.FavoriteMentor;
import com.sarthak.skillbuilder.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteMentorRepository extends JpaRepository<FavoriteMentor, Long> {
    List<FavoriteMentor> findByMentee(User mentee);
    Optional<FavoriteMentor> findByMenteeAndMentor(User mentee, User mentor);
    boolean existsByMenteeAndMentor(User mentee, User mentor);
    void deleteByMenteeAndMentor(User mentee, User mentor);
}
