import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';

import PlacementPoster, { POSTER_WIDTH, POSTER_HEIGHT } from './PlacementPoster';

// Designed templates, keyed by post type (see src/ai/postTypes.js). A post
// type without a template is shown as a normal image post instead.
// Each template is drawn on a fixed canvas and gets:
//   fields   — the facts from the prompt (editable by the user)
//   images   — slot name → cropped image URI
//   brandKit — the saved Brand Kit
const BUILT_IN = {
  placement: { Component: PlacementPoster, width: POSTER_WIDTH, height: POSTER_HEIGHT, props: {} },
};

// The built-in template for a post type, if it has one. (The account's own
// designs are drawn as finished images instead — see designedPost.js.)
export function getTemplate(postType) {
  return BUILT_IN[postType] || null;
}

// Shows a template shrunk to whatever width it's given. The inner canvas
// itself is never transformed, so a ref to it can be exported at the
// template's real size.
export function ScaledTemplate({ template, templateRef, style, ...props }) {
  const [frameWidth, setFrameWidth] = useState(0);
  if (!template) return null;

  const { Component, width, height } = template;
  const scale = frameWidth / width;

  return (
    <View
      style={[styles.frame, { aspectRatio: width / height }, style]}
      onLayout={(e) => setFrameWidth(e.nativeEvent.layout.width)}
    >
      {frameWidth > 0 && (
        <View style={[styles.inner, { width, height, transform: [{ scale }] }]}>
          <Component ref={templateRef} {...template.props} {...props} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', overflow: 'hidden' },
  inner: { transformOrigin: 'top left' },
});
