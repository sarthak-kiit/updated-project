package com.sarthak.skillbuilder.service;

import com.sarthak.skillbuilder.dto.MentorProfileDTO;
import com.sarthak.skillbuilder.entity.*;
import com.sarthak.skillbuilder.exception.*;
import com.sarthak.skillbuilder.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteMentorRepository favoriteRepository;
    private final UserRepository userRepository;
    private final MentorService mentorService;

    @Transactional
    public void addFavorite(Long menteeId, Long mentorId) {
        User mentee = userRepository.findById(menteeId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", menteeId));
        User mentor = userRepository.findById(mentorId)
                .orElseThrow(() -> new ResourceNotFoundException("Mentor", "id", mentorId));
        if (favoriteRepository.existsByMenteeAndMentor(mentee, mentor))
            throw new DuplicateResourceException("Mentor already in favorites");

        favoriteRepository.save(FavoriteMentor.builder().mentee(mentee).mentor(mentor).build());
    } 

    @Transactional
    public void removeFavorite(Long menteeId, Long mentorId) {
        User mentee = userRepository.findById(menteeId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", menteeId));
        User mentor = userRepository.findById(mentorId)
                .orElseThrow(() -> new ResourceNotFoundException("Mentor", "id", mentorId));
        favoriteRepository.deleteByMenteeAndMentor(mentee, mentor);
    }

    public List<MentorProfileDTO> getFavoritesForMentee(Long menteeId) {
        User mentee = userRepository.findById(menteeId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", menteeId));
        return favoriteRepository.findByMentee(mentee).stream()
                .map(fav -> mentorService.getMentorByUserId(fav.getMentor().getId()))
                .collect(Collectors.toList());
    }
}
